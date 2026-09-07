# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

tremolo-ui は Web Audio アプリ向けの headless なコンポーネントライブラリ。npm workspaces のモノレポから 3 つのパッケージを公開している。Node >= 22（`.nvmrc` は 24 を固定）、`.npmrc` で `engine-strict=true`。

| ワークスペース | パッケージ | 内容 |
| --- | --- | --- |
| `packages/functions` | `@tremolo-ui/functions` | 純粋関数のみ（math / midi / util）。`sideEffects: false` |
| `packages/dom` | `@tremolo-ui/dom` | DOM 依存・framework 非依存のコア。`destroy()` を持つ命令的インスタンスを返す |
| `packages/react` | `@tremolo-ui/react` | 全コンポーネント + hooks。依存は `@tremolo-ui/dom` / `@tremolo-ui/functions` / `clsx` / `zustand` |
| `site` | private | Docusaurus ドキュメントサイト（en / ja） |

## コマンド

特記がなければリポジトリルートで実行する。

```bash
npm run test                  # 全ワークスペース
npm run test -w packages/functions
npm run test -w packages/dom
npm run test -w packages/react
npm run build:package         # 全ワークスペース（tsc --emitDeclarationOnly + tsdown）
npm run build:sb              # 全パッケージをビルドしてから Storybook をビルド
npm run lint                  # oxlint（自動修正は lint:fix）
npm run format                # oxfmt（差分だけ見るなら format:check）
npm run sb -w packages/react  # Storybook 開発サーバ（:6006）
npm run typecheck -w packages/react
npm run changeset             # リリースに含める変更に changeset を追加
```

単一テストファイルの実行（vitest。`packages/*/vitest.config.ts`）:

```bash
npm run test -w packages/functions -- __tests__/math.test.ts
npm run test -w packages/dom -- __tests__/pointer/drag.test.ts
npm run test -w packages/react -- src/components/Slider/type.test.ts
npm run test:watch -w packages/react   # ウォッチ
```

**vitest は `globals: true` で走らせている。** `describe` / `test` / `expect` / `vi` を import 無しで使えるようにするためだが、それ以上に **Testing Library の自動 cleanup がグローバルの `afterEach` の有無で自分を仕込むかどうかを決める**ため。型は各パッケージの `vitest.d.ts` が `/// <reference types="vitest/globals" />` で入れている（`compilerOptions.types` に書くと、他の `@types` の自動読み込みが止まる）。

ドキュメントサイト:

```bash
npm run docs           # docusaurus start（typedoc の API 生成が走るので遅い）
npm run docs:fast      # SKIP_API=true で typedoc をスキップ
npm run docs:ja        # --locale ja
npm run docs:wtr:ja    # ja の翻訳スタブを再生成
npm run build:docs
```

**site と Storybook は workspace の symlink 経由でパッケージのビルド済み `dist/` を参照している。** `packages/*/src` を変更したら、site（やドキュメントの example）に反映する前に `npm run build:package` が必要。`react` から `dom` / `functions` の新しいコードを使う場合も同様。

### PR を作る前に

**パッケージだけでなく、成果物を全てビルドすること。**

```bash
npm run lint
npm run format:check
npm run test
npm run build:sb      # build:package + Storybook
npm run build:docs    # ドキュメントサイト（typedoc の生成が走る。en / ja 両方）
```

GitHub Actions も `lint` / `format:check` / `build:package` / `test` / Storybook / ドキュメントサイトを全て回すが、**手元で通してから push すること。** CI は 1 つの job を直列に流すので、docs のビルド失敗に気づくまで数分かかる。

**ワークフローは trigger ごとに 2 つに分けてある。**

| ファイル | trigger | すること |
| --- | --- | --- |
| `ci.yml` | `push`（main） | lint / test / ビルド → `wrangler deploy`（本番） |
| `pull-request.yml` | `pull_request` | lint / test / ビルド → `wrangler versions upload` → PR にコメント |

**ビルドまでの手順は 2 ファイルで同じものが重複している。** 分けたのは trigger 単位で読めるようにするためなので、**片方にステップを足したらもう片方にも足すこと。** `paths` フィルタも同様（YAML のアンカーはファイルをまたげない）。

- 分かれるのは末尾だけ。`ci.yml` は `Deploy` の 1 ステップ、`pull-request.yml` は alias の算出 / `Upload preview` / ステータス算出 / sticky comment の 4 ステップ
- `permissions` は job に書く。`pull-requests: write` が要るのは `pull-request.yml` だけ
- **どちらも job 名が `build` なので、必須チェックの表示名が同じになる。** branch protection で選ぶときはワークフロー名（`Build and Test` / `Pull Request`）で見分けること

`paths` フィルタにより、**site の外の `.md` のみの変更（`README.md` / `plans/` / `.changeset/`）では実行されない。** ビルドにもテストにも影響しないため。`site/` 配下は `.md` も含めて対象（最後の `site/**` が除外から戻している）。**changeset だけを足した PR は CI 信号がゼロになる**点は知っておくこと。

**`pull-request.yml` の `pull_request` に `branches` を書いていないのは stacked PR のため。** 中段の PR は base が main ではないので、`branches: [main]` を書くと取りこぼすことがある（GitHub はスタック認識後のイベントなら base をスタックの base として扱うが、`gh stack submit` は PR を作ってからスタックにまとめるので `opened` の時点では効かない）。`concurrency` で同じ PR の古い実行は打ち切るが、**main への push は打ち切らない**（どのコミットで main が通ったかの記録が欠けるため）。

**ビルドの後にデプロイまでやる**（`## デプロイ`）。PR では preview を上げるだけで本番は動かない。

過去に踏んだもの:

- `packages/*/src` にファイルを足す・移すと、`site/docusaurus.config.ts` の typedoc の `entryPoints` が拾って API ページを生成する。Docusaurus は `_` で始まるパスを docs から除外するため、`_util` や `_internal` を `exclude` に入れておかないと「存在しない doc id を指すサイドバー」になってビルドが落ちる
- パッケージを追加したとき、Storybook のビルドコマンドが個別指定だと新しい `dist` が無くて落ちる（`plans/core-extraction-plan.md` Phase 1。Vercel 時代の話だが、`build:sb` が `build:package` を含んでいる理由がこれ）
- **typedoc のサイドバーは 1 つ（`typedocSidebar`）で、Docusaurus の翻訳キーはラベルから作られる。** typedoc はページのラベルにモジュールパスの**最後のセグメントだけ**を使うので、`midi/input.ts` と `piano/input.ts` のように名前が被るとキーが衝突してビルドが落ちる。パッケージをまたいでも起きる（`dom/piano` と `functions/piano`）。`site/sidebars.ts` の `withKeys()` が doc id を `key` に入れて回避しているので、typedoc plugin を足すときは必ずそれを通すこと
- **`tsconfig.json` の `lib` に `DOM.Iterable` が要る。** `compilerOptions.types` を書いていないので、TypeScript は `node_modules/@types/*` を全て読み込む。`DOM.Iterable`（NodeList の spread、`MIDIInputMap.values()`）は `jest-environment-jsdom` 経由で入っていた `@types/jsdom` がたまたま `/// <reference lib="dom.iterable" />` を持っていたから通っていただけだった。依存を 1 つ外すと `tsc` が落ちる、という形で出る

## アーキテクチャ

### namespace オブジェクトによる compound component

各コンポーネントのディレクトリ（`packages/react/src/components/<Name>/`）は単一のコンポーネントではなくプレーンなオブジェクトを export する。例: `Slider = { Root, Thumb, Track, Scale, ScaleOption }`、`Knob = { Root, SVGRoot, InactiveLine, ActiveLine, Thumb }`。`Root` は `forwardRef` で、`useImperativeHandle` により `*Methods` インターフェース（`focus` / `blur` など）を公開する。

Slider / Knob / XYPad は children をそのまま描画し、`children` は型で必須。既定の描画へのフォールバックは無い。**Piano だけが旧来の形のまま**で、`React.Children.map` で子に props を注入し、children が無ければ自前で描画する。`/** @internal */` が付き `__` で始まる props はその注入用の内部 API で、残っているのは `Piano/key.tsx` と `Piano/KeyLabel.tsx` のみ。ドキュメント化・公開はしない。

### サブコンポーネントへの設定の配り方

サブコンポーネントを持つコンポーネントには `context.tsx` があり、サブコンポーネントは props のバケツリレーではなく `useXContext(selector)` でそこから読む。中身は 2 通りある。

- Slider / Knob / XYPad: 素の React context。`value` も導出値もレンダー中に計算するので、同期する state が無い
- NumberInput / Piano / PointsEditor: zustand の `createStore` を context で配り、props を `setState` で同期する。**未移行**（`plans/core-extraction-plan.md` の Phase 5）

### インタラクション用 hooks

ポインタ / ホイール / MIDI の実体は `@tremolo-ui/dom`（`createDrag` / `createDragValue` / `createWheel` / `createMIDIAccess` など）にあり、`packages/react/src/hooks/` の hook はそれを React に橋渡しするだけ。`useDrag` / `useWheel` は ref コールバックを 1 つ返し、`useDragValue` は `{ refCallback, dragging }` を返す。Slider / Knob / XYPad / PointsEditor のドラッグは全て `useDragValue` を通る（設計の意図は `plans/core-extraction-plan.md` の Phase 3）。

**ドラッグ系 hook は要素を state で保持し、生成・破棄を `useEffect` で行う。** ref コールバックの中でインスタンスを作ると、呼び出し側がインライン ref を書いた場合に再レンダーのたびに ref が付け直され（`ref(null)` → `ref(node)`）、ドラッグが中断される。

**設定は effect の依存に入れず、インスタンスの `update()` で流し込む。** 依存に入れると、ドラッグ中に `min` / `max` などが変わった時点でインスタンスが破棄されてドラッグが切れる。

内部専用の hook は `src/hooks/_internal/` に置く（`useCallbackRef` / `usePianoDrag` / `useRefCallbackEvent`）。`src/hooks/` 直下にあるものは公開 API で、`src/index.ts` から re-export され、生成される typedoc にも載る。`useRefCallbackEvent` は passive でないリスナを張るためのもので、現在は `usePianoDrag` からのみ使われている。

### スタイリング

**パッケージは CSS を配らない。** コンポーネントが持つのはマークアップと、`tremolo-` プレフィックスのクラス名と、状態を表す属性だけ。`packages/react` に `.css` は 1 つも無く、`dist/index.css` も生成されない（`plans/core-extraction-plan.md` 5.1）。

**状態は ARIA / `data-*` 属性で表す。** `[aria-disabled]` `[aria-readonly]` `[data-dragging]` `[data-vertical]` `[data-active]` `[data-out-of-range]`。これが利用者にとって唯一のスタイリングの取っ掛かりなので、**新しい状態を足したら必ず属性として出すこと。** クラスを足して表現してはいけない。

**デモのテーマは `site/src/css/tremolo/<Name>.css` にある。** ドキュメントサイトが `docusaurus.config.ts` の `customCss` で、Storybook が `.storybook/preview.tsx` から相対パスで、同じファイルを読む。コピー元として公開する場所と実際に使う場所を 1 つにしてあるので、**コンポーネントに新しいパートを足したらここに書く**（`site/docs/tutorials/styling.mdx` がタブで全文を載せているため、追記は自動で反映される）。

ドラッグ中のスタイルは 2 系統ある。`touch-action` / `user-select` / `cursor` は `createDrag` が**対象要素に直接**適用し `destroy()` で戻す（pointer capture により、ポインタが要素外へ出ても維持される）。ページ全体へ掛ける `user-select: none` は `src/components/_util/index.ts` が `<body>` のインラインスタイルとして付け外しする。**カウンタを持っている**のは、2 本指で 2 つのコンポーネントを同時にドラッグしたとき、先に離した方が復元してしまうのを防ぐため。

### stories とテスト

**1 つのコンポーネント / hook に対応する story とテストは、実装の隣に置く。** `src/components/<Name>/Slider.stories.tsx`、`src/components/<Name>/draft.test.tsx`、`src/hooks/useDrag.test.tsx` のように。

**複数のコンポーネントにまたがるものだけ `packages/react/__tests__/` / `__stories__/` に残す。** `__tests__/drag.test.tsx`、`__tests__/Slider/compose.test.tsx`、`__tests__/util/`、`__tests__/storybook/`、`__stories__/combined/`、それに story 用のヘルパーとスタイル（`__stories__/lib/`、`__stories__/styles/`、`public/`、`intro.mdx`）。

`src/` の中に置くので、**新しい種類のファイルを足すときは 3 箇所が publish と typedoc に効く**。

- `packages/react/package.json` の `files` は `src` を丸ごと含むので、`!src/**/*.test.{ts,tsx}` のような否定パターンで除く（`npm pack --dry-run` で確認できる）
- `site/docusaurus.config.ts` の typedoc の `exclude`。react の `entryPoints` は `src/hooks/**/*.{ts,tsx}` と hooks だけ全ファイルを取るので、除外しないと API ページが生成される
- `.storybook/main.ts` の `stories` グロブ

Controls に出る型は `.storybook/propTypes.ts` が補っている。react-docgen は型をソースに書かれたまま記録するため、エイリアスやジェネリックは名前しか出ない。ビルド時に TypeScript の checker で prop ごとの型を解決し、**コンポーネントそのものをキーにした Map**（`virtual:tremolo-prop-types`）として preview に渡している。名前をキーにしないのは、`Root` だけではどのコンポーネントのものか分からないため。

**`Root` は `export const Root = forwardRef(...)` の形で export すること。** Storybook の docgen（`react-docgen`）は export されたコンポーネント定義しか拾わないため、`const Root` のままだと props が 1 つも認識されず、**Controls パネルに story の `args` / `argTypes` で明示したものしか出てこない**。`Slider` の `reverse` が出ていなかったのがこれ。

**モジュールのトップレベルで関数を呼ぶときは `/* @__PURE__ */` を付けること。** `forwardRef(...)` と `createContext(...)` がこれに当たる。注釈が無いとバンドラは副作用があるかもしれないと見なして残すので、**`Knob` だけを import しても Piano も Slider も NumberInput も落ちない**（実測で 32,362 → 11,567 バイト。core-extraction-plan.md 5.23）。名前空間オブジェクト（`export const Knob = { Root, ... }`）が犯人に見えるが、そちらではない。

`src/index.ts` から re-export しなければ公開 API には入らない。`tsdown.config.ts` はパッケージビルドのたびに `publint`（error）と `attw`（warn）を実行するので、exports map や型解決のミスは `build:package` で失敗する。

## 規約

- **import の並び順は lint ではなく formatter が持つ。** oxlint に `import/order` が無いため、`.oxfmtrc.json` の `sortImports` が並べ替える。グループごとにアルファベット順、グループ間は空行、`@tremolo-ui/**` は external の直後、`import type` と CSS は最後。**`partitionByComment: true` にしてあるので、import の間にあるコメントを越えて並べ替えない**（`site/examples/*` の `// expand begin` / `// expand end` はドキュメントの折りたたみ範囲を決めているので、越えられると表示が変わる）。
- `no-unused-vars` は先頭 `_` を許容。ルールは `.oxlintrc.json`（JSON だがコメントを書ける）。**oxlint は `eslint-disable` コメントも読むが、リポジトリでは `oxlint-disable` に統一している。** ルール名の名前空間が違う（`@typescript-eslint/x` → `typescript/x`）ので、揃えておかないと後でルールを有効にしたときに黙って効かなくなる。
- husky + lint-staged により、コミットごとに `oxlint --fix` と `oxfmt` が走る（**どちらも `--no-error-on-unmatched-pattern` 付き**。渡されたパスが全て ignore に当たると「対象が無い」で非ゼロ終了するので、付けないと `.md` だけのコミットが落ちる）。CI も `lint` と `format:check` を回す。
- `.cspell.json` を使用しているため、新しいドメイン用語は追加が必要になる場合がある。

## デプロイ

**ホスティングは Cloudflare Workers（`tremolo-ui.mimoz.dev`）で、デプロイも CI（`ci.yml` / `pull-request.yml`）の中でやる。**

| | Worker | 設定 | 配信先 |
| --- | --- | --- | --- |
| ドキュメントサイト | `tremolo-ui-docs` | `site/wrangler.jsonc` | `tremolo-ui.mimoz.dev/`（Custom Domain） |
| Storybook | `tremolo-ui-sb-react` | `packages/react/wrangler.jsonc` | `tremolo-ui.mimoz.dev/i/storybook-react`（Route） |

- **どちらも `main` を持たない静的アセットだけの Worker。** 静的アセットへのリクエストは無料かつ無制限だが、スクリプトが起動した分は 100,000 req/day にカウントされ、**無料プランは超過時にアセットへフォールバックせず 429 を返す**。1 つのホスト名に 2 サイトを載せるのに自前のルータ Worker を挟んではいけない
- **Worker を 2 つに分けているのは `html_handling` が Worker 単位の設定だから。** docs は `trailingSlash: true` なので `force-trailing-slash`、Storybook は `iframe.html` を拡張子付きで読むので `auto-trailing-slash`。同居させるとストーリーを切り替えるたびに 307 を踏む
- **同一ホスト名では Route が Custom Domain より優先される**ので、この 2 段が成立する。Route には proxied な DNS レコードが必須で、それを作るのは docs 側の Custom Domain なので、**デプロイは必ず docs が先**
- **Storybook はサブパス配信なので `base` が要る。** `.storybook/main.ts` の `STORYBOOK_BASE` を `viteFinal` が **`configType === 'PRODUCTION'` のときだけ**入れる（dev に掛けると `localhost:6006` のローカル URL まで変わる）。あわせて `build:sb` は `-o storybook-static/i/storybook-react` に出す。**Workers Static Assets はリクエストパスをファイルパスに突き合わせる**ので、配信するプレフィックスと同じ形でファイルを置く必要がある
  - このため `__stories__/public` のファイルを参照する story は `import.meta.env.BASE_URL` を前置きすること（`Slider.stories.tsx`）。ルート絶対パスで書くとサブパス配信で 404 になる
- **preview は `wrangler versions upload --preview-alias <branch>`。** `versions upload` はルートに適用しないので本番は動かない。preview URL は `<alias>-<worker>.<subdomain>.workers.dev` で、**workers.dev 以外のサブドメインには現状置けない**。alias は小文字・数字・ハイフンのみで先頭は小文字、`alias + Worker 名` で 63 文字以内（DNS の制約）
  - **preview URL は `workers_dev` が有効なときだけ出る。** 無効にすると preview も消えるので、両方 true のままにして Cloudflare Access（Zero Trust の無料枠は 50 シート）で塞ぐ
  - **fork からの PR には secrets が渡らないのでデプロイ系のステップは落ちる。** Access を掛ける以上どのみち外部の人は見られないので、`pull_request_target` は使わない
- Workers Builds（Cloudflare 側のリポジトリ連携）は使わない。Worker 2 つ × push ごとにモノレポ全体を 2 回ビルドすることになり、無料枠（3,000 分/月・同時 1）を食う。**CI が既に全部ビルドしている**
- **preview URL は `marocchino/sticky-pull-request-comment` で PR に貼る**（`header: preview`）。コメントを更新するために **`pull-request.yml` の job に `pull-requests: write` が要る**。既定に任せるとリポジトリ設定次第で read-only になり 403 で落ちる
  - コメントのステップは `always()` 付き。upload が落ちた PR にも「失敗した」ことを貼るため。`continue-on-error` は付けていないので job は red のまま
- 必要な secrets / variables: `CLOUDFLARE_API_TOKEN`（Account -> Workers Scripts:Edit、Zone -> Workers Routes:Edit）、`CLOUDFLARE_ACCOUNT_ID`、`vars.CLOUDFLARE_WORKERS_SUBDOMAIN`（preview URL の組み立てにのみ使う）

## リリース

changesets を使う。リリースに含めたい変更には `npm run changeset` で `.changeset/*.md` を追加し、変更と一緒にコミットする。

`main` に変更が入ると `.github/workflows/release.yml` が `changesets/action` を実行し、"Version Packages" PR を作成/更新する。**その PR をマージした時点で** npm trusted publishing（OIDC）により publish され、パッケージ単位の GitHub リリースと CHANGELOG が生成される。

- `.changeset/config.json` の `fixed` は `[["@tremolo-ui/*"]]`。全パッケージが常に同一バージョンでリリースされ、changeset が無いパッケージも一緒に bump される
- **破壊的変更でも `major` ではなく `minor` を選ぶ。** 0.x を維持するため（`major` を選ぶと 1.0.0 になる）
- **新しいパッケージを追加するときは、コードを `main` に入れる前にローカルから手動 publish し、npm 側で trusted publisher を登録する。** `changesets/action` は changeset が無いときに publish を実行するため、npm 上に存在しないパッケージが `main` に入ると E404 で落ちる
