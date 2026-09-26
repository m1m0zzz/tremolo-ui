# AGENTS.md

## 概要

tremolo-ui は Web Audio アプリ向けの headless なコンポーネントライブラリ。npm workspaces のモノレポから 5 つのパッケージを公開している

| ワークスペース | パッケージ | 内容 |
| --- | --- | --- |
| `packages/functions` | `@tremolo-ui/functions` | **汎用な関数だけ**を置く。依存を持たない |
| `packages/dom` | `@tremolo-ui/dom` | DOM 依存・framework 非依存のコア。`destroy()` を持つ命令的インスタンスを返す |
| `packages/react` | `@tremolo-ui/react` | 全コンポーネント + hooks |
| `packages/svelte` | `@tremolo-ui/svelte` | Svelte 5 の全コンポーネント + actions |
| `packages/vue` | `@tremolo-ui/vue` | Vue 3 の全コンポーネント + composables |
| `site` | private | Docusaurus ドキュメントサイト（en / ja） |

**`functions` に置くのは汎用な関数だけ。** 目的は、このライブラリ群で使っている汎用な関数を利用者が使いやすい形で公開すること。判定は「純粋かどうか」ではなく「このライブラリを使わない人が使うか」で、実装の都合で必要になっただけのものは `dom` に置く（棚卸しの結果は `docs/functions-scope.md`）。

**1.0 までは互換性を維持しなくてよい。** 既存の API に合わせて妥協するより、ライブラリとして最良の形を優先する。破壊的変更を避けるための回避策や、非推奨のまま残す API を増やさないこと（changeset で `minor` を選ぶ理由は「リリース」を参照）。

**このファイルにはソースから読み取れないことだけを書く。** 個々の設定の意図はその設定ファイルのコメントに置き、ここには複数のファイルにまたがる決まりごとと、コードを見ても分からない禁止事項だけを残す。ファイル名や API を並べると、実装が変わったときに嘘が残る。

## コマンド

特記がなければリポジトリルートで実行する。

```bash
npm run test                  # 全ワークスペース（-w packages/<name> で個別に）
npm run build:package         # src を変えたら必要。site / Storybook は symlink 越しに dist を見る
npm run build:sb              # 全パッケージをビルドしてから Storybook をビルド
npm run lint                  # oxlint（自動修正は lint:fix）
npm run format                # oxfmt（差分だけ見るなら format:check）
npm run sb -w packages/react  # Storybook 開発サーバ（-w packages/svelte / packages/vue も）
npm run typecheck -w packages/react
npm run typecheck -w packages/svelte  # svelte-check
npm run typecheck -w packages/vue
npm run build:docs
npm run docs:ja               # --locale ja
npm run docs:wtr:ja           # ja の翻訳スタブを再生成
```

単一テストファイルの実行（vitest）:

```bash
npm run test -w packages/react -- src/components/Slider/Slider.type.test.ts
npm run test:watch -w packages/react
```

### PR を作る前に

**パッケージだけでなく、成果物を全てビルドすること。** `lint` / `format:check` / `test` / `build:sb` / `build:docs` を手元で通してから push する。CI も同じものを回すが、1 つの job を直列に流すので、docs のビルド失敗に気づくまで数分かかる。

- **`ci.yml` と `pull-request.yml` は、ビルドまでの手順が同じものの重複。** trigger 単位で読めるように分けてあるので、**片方にステップを足したらもう片方にも足すこと**（`paths` フィルタも同様。YAML のアンカーはファイルをまたげない）
- `paths` フィルタの結果、**changeset だけを足した PR は CI 信号がゼロになる**
- `concurrency` が main への push を打ち切らないのは、どのコミットで main が通ったかの記録が欠けるため

## アーキテクチャ

コンポーネント・hooks・stories とテストの書き方など、`@tremolo-ui/react` の中だけで効く決まりごとは `packages/react/AGENTS.md` にある。ここには複数のパッケージや `site` にまたがるものだけを置く。

### スタイリング

- **パッケージは CSS もクラス名も配らない。** 各パートが持つのは、利用者が渡した `className` / `style` と、状態を表す `data-*` 属性だけ。`tremolo-` のクラス名は廃止済み
- **新しい状態を足したら必ず `data-*` 属性として出すこと。** 利用者にとって唯一のスタイリングの取っ掛かり。**真偽の状態は on のときだけ属性を出し、値は空文字にする**（`cond ? '' : undefined`）。`cond || undefined` と書くと React が `="true"` に変換してしまい、有無で選ぶという契約に値が紛れ込む（Radix / Base UI も空文字）。向きのような列挙は `data-orientation="horizontal|vertical"` の形で値を持たせる
- **ARIA はそれ自体がコントロールである要素にだけ付ける**（`Knob` / `NumberInput.InputField` / ステッパー / thumb の中の range input）。ラッパーは `data-*` だけ
- **パートの配置はコンポーネントが持つ。** `position` / `translate` / `inset` / `z-index` / `pointer-events` はインラインで書き、テーマ CSS には置かない。上書きの余地がある中央合わせは `--translate` で開ける
- **デモのテーマは `shared/css/<Name>.module.css` の 1 セットしかない。** ドキュメントサイトと Storybook が同じファイルを読み、`site/docs/tutorials/styling.mdx` がその全文を載せている。**コンポーネントに新しいパートを足したらここに書き、story と例で `className` を配線する**

### 公開 API とバンドル

- `src/index.ts` から re-export しなければ公開 API には入らない
- **ラッパー（`react` など）は `dom` / `functions` のものを re-export しない。** props に出てくる型や既定値でも、利用者には `@tremolo-ui/dom` / `@tremolo-ui/functions` から直接 import してもらう。同じものが複数のパッケージから出ていると、どれから import すべきかが分からず、ラッパーごとに公開範囲がずれていく
- **モジュールのトップレベルで関数を呼ぶときは `/* @__PURE__ */` を付けること**（`forwardRef(...)` / `createContext(...)`）。注釈が無いとバンドラは副作用があるかもしれないと見なして残すので、**`Knob` だけを import しても Piano も Slider も落ちてこない**

## 規約

- **コンポーネントまたは hook を export しない TypeScript の実装ファイルは kebab-case にする。** コンポーネントの PascalCase と、hook の `use...` camelCase だけを例外とする
- **`packages/dom` / `packages/functions` のテストは `__tests__/` に `src` と同じ構成で置き、実装のファイル名に合わせる。** 1 つのファイルのテストをトピックで分けるときは `<file>.<topic>.test.ts`（トピックは kebab-case）。`packages/react` はテストを実装の隣に置くので、規約は `packages/react/AGENTS.md` にある
- **`.svelte` / `.vue` だけは prettier で整形する。** oxfmt が読めないため。`format` / `format:check` / lint-staged がファイルの種類で振り分けている。設定（`.prettierrc.json`）は `.oxfmtrc.json` と同じ見た目に揃え、`.ts` などを prettier で整形しないこと
- **import の並び順は lint ではなく formatter が持つ**（oxlint に `import/order` が無いため）。並びとその理由は `.oxfmtrc.json` のコメント
- **`eslint-disable` ではなく `oxlint-disable` に統一する。** oxlint は両方読むが、ルール名の名前空間が違う（`@typescript-eslint/x` → `typescript/x`）ので、揃えておかないと後でルールを有効にしたときに黙って効かなくなる
- **lint-staged の `--no-error-on-unmatched-pattern` を外さないこと。** 渡されたパスが全て ignore に当たると「対象が無い」で非ゼロ終了し、`.md` だけのコミットが落ちる
- `.cspell.json` を使用しているため、新しいドメイン用語は追加が必要になる場合がある
- **vitest は `globals: true` で走らせる。** Testing Library の自動 cleanup が、グローバルの `afterEach` の有無で自分を仕込むかどうかを決めるため
- **site のスクリプトで生成物が要るものには、`npm run changelog &&` / `npm run api-props &&` を直接書く。** npm の `pre*` に頼ると、`start:fast` のようにスクリプトが増えたときに付け忘れる
- **コンポーネントのページの props の表は、`site/scripts/api-props.mjs` が JSDoc から作る。** 説明を直すときは JSDoc を直す。日本語の説明は `site/i18n/ja/api-props.json` にあり、英語が変わると古い訳は使われず英語が出る（スクリプトが一覧を出すので訳し直す）

## デプロイ

**ホスティングは Cloudflare Workers（`tremolo-ui.mimoz.dev`）で、デプロイも CI の中でやる。** ドキュメントサイトと Storybook で Worker が分かれていて、1 つのホスト名を Custom Domain と Route で分け合っている。**個々の設定の意図は 2 つの `wrangler.jsonc` と `pull-request.yml` のコメントにある。**

- **Workers Builds（Cloudflare 側のリポジトリ連携）は使わない。** Worker 2 つ × push ごとにモノレポ全体を 2 回ビルドすることになり、無料枠（3,000 分/月・同時 1）を食う。**CI が既に全部ビルドしている**
- **アセットの置き場を増やしたら `_headers` を見直す。** 内容ハッシュが入っているものだけ `immutable` にしてよい
- **旧 URL（Vercel 時代）は消せない。** publish 済みの 0.x の README に焼き付いているため、`vercel-redirect/` で新しいドメインへ 308 で飛ばしている。**触るときは `vercel-redirect/README.md` を読むこと**

## リリース

changesets を使う。リリースに含めたい変更には `npm run changeset` で `.changeset/*.md` を追加し、変更と一緒にコミットする。`main` に変更が入ると `changesets/action` が "Version Packages" PR を作成/更新し、**その PR をマージした時点で** npm trusted publishing（OIDC）により publish される。

- **破壊的変更でも `major` ではなく `minor` を選ぶ。** 0.x を維持するため（`major` を選ぶと 1.0.0 になる）
- **新しいパッケージを追加するときは、コードを `main` に入れる前にローカルから手動 publish し、npm 側で trusted publisher を登録する。** `changesets/action` は changeset が無いときに publish を実行するため、npm 上に存在しないパッケージが `main` に入ると E404 で落ちる
