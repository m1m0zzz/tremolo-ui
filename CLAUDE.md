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
npm run lint                  # eslint .（自動修正は lint:fix）
npm run format                # prettier . --write
npm run sb -w packages/react  # Storybook 開発サーバ（:6006）
npm run typecheck -w packages/react
npm run changeset             # リリースに含める変更に changeset を追加
```

単一テストファイルの実行（jest / ts-jest preset / jsdom）:

```bash
npm run test -w packages/functions -- __tests__/math.test.ts
npm run test -w packages/dom -- __tests__/pointer/drag.test.ts
npm run test -w packages/react -- src/components/Slider/type.test.ts
```

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
npm run test
npm run build:sb      # build:package + Storybook
npm run build:docs    # ドキュメントサイト（typedoc の生成が走る。en / ja 両方）
```

GitHub Actions（`build.yml`）も `build:package` / `test` / Storybook / ドキュメントサイトを全て回すが、**手元で通してから push すること。** CI は 1 つの job を直列に流すので、docs のビルド失敗に気づくまで数分かかる。

`build.yml` には `paths` フィルタが入っていて、**site の外の `.md` のみの変更（`README.md` / `plans/` / `.changeset/`）では実行されない。** ビルドにもテストにも影響しないため。`site/` 配下は `.md` も含めて対象（最後の `site/**` が除外から戻している）。**changeset だけを足した PR は CI 信号がゼロになる**点は知っておくこと。

**`pull_request` に `branches` を書いていないのは stacked PR のため。** 中段の PR は base が main ではないので、`branches: [main]` を書くと取りこぼすことがある（GitHub はスタック認識後のイベントなら base をスタックの base として扱うが、`gh stack submit` は PR を作ってからスタックにまとめるので `opened` の時点では効かない）。`concurrency` で同じ PR の古い実行は打ち切るが、**main への push は打ち切らない**（どのコミットで main が通ったかの記録が欠けるため）。

Vercel は無料プランでビルド回数の上限があり、**24 時間の rate limit に当たるとプレビューが作られない。** stacked PR で 3 レイヤ同時に上げると 6 デプロイが走って当たる。CI 側でビルドしているので検証は済んでいるが、プレビュー URL は出ない。

過去に踏んだもの:

- `packages/*/src` にファイルを足す・移すと、`site/docusaurus.config.ts` の typedoc の `entryPoints` が拾って API ページを生成する。Docusaurus は `_` で始まるパスを docs から除外するため、`_util` や `_internal` を `exclude` に入れておかないと「存在しない doc id を指すサイドバー」になってビルドが落ちる
- パッケージを追加したとき、Vercel の Storybook プロジェクトのビルドコマンドが個別指定だと新しい `dist` が無くて落ちる（`plans/core-extraction-plan.md` Phase 1）
- **typedoc のサイドバーは 1 つ（`typedocSidebar`）で、Docusaurus の翻訳キーはラベルから作られる。** typedoc はページのラベルにモジュールパスの**最後のセグメントだけ**を使うので、`midi/input.ts` と `piano/input.ts` のように名前が被るとキーが衝突してビルドが落ちる。パッケージをまたいでも起きる（`dom/piano` と `functions/piano`）。`site/sidebars.ts` の `withKeys()` が doc id を `key` に入れて回避しているので、typedoc plugin を足すときは必ずそれを通すこと

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

**`Root` は `export const Root = forwardRef(...)` の形で export すること。** Storybook の docgen（`react-docgen`）は export されたコンポーネント定義しか拾わないため、`const Root` のままだと props が 1 つも認識されず、**Controls パネルに story の `args` / `argTypes` で明示したものしか出てこない**。`Slider` の `reverse` が出ていなかったのがこれ。`src/index.ts` から re-export しなければ公開 API には入らない。`tsdown.config.ts` はパッケージビルドのたびに `publint`（error）と `attw`（warn）を実行するので、exports map や型解決のミスは `build:package` で失敗する。

## 規約

- ESLint が `import/order` を強制する。グループごとにアルファベット順、グループ間は空行。`@tremolo-ui/**` は external グループ扱い、CSS の import は最後。`no-unused-vars` は先頭 `_` を許容。
- husky + lint-staged により、コミットごとに Prettier と eslint --fix が走る。
- `.cspell.json` を使用しているため、新しいドメイン用語は追加が必要になる場合がある。

## リリース

changesets を使う。リリースに含めたい変更には `npm run changeset` で `.changeset/*.md` を追加し、変更と一緒にコミットする。

`main` に変更が入ると `.github/workflows/release.yml` が `changesets/action` を実行し、"Version Packages" PR を作成/更新する。**その PR をマージした時点で** npm trusted publishing（OIDC）により publish され、パッケージ単位の GitHub リリースと CHANGELOG が生成される。

- `.changeset/config.json` の `fixed` は `[["@tremolo-ui/*"]]`。全パッケージが常に同一バージョンでリリースされ、changeset が無いパッケージも一緒に bump される
- **破壊的変更でも `major` ではなく `minor` を選ぶ。** 0.x を維持するため（`major` を選ぶと 1.0.0 になる）
- **新しいパッケージを追加するときは、コードを `main` に入れる前にローカルから手動 publish し、npm 側で trusted publisher を登録する。** `changesets/action` は changeset が無いときに publish を実行するため、npm 上に存在しないパッケージが `main` に入ると E404 で落ちる
