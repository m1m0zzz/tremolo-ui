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
npm run test -w packages/react -- __tests__/Slider/type.test.ts
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

## アーキテクチャ

### namespace オブジェクトによる compound component

各コンポーネントのディレクトリ（`packages/react/src/components/<Name>/`）は単一のコンポーネントではなくプレーンなオブジェクトを export する。例: `Slider = { Root, Thumb, Track, Scale, ScaleOption }`、`Knob = { Root, SVGRoot, InactiveLine, ActiveLine, Thumb }`。`Root` は `forwardRef` で、`useImperativeHandle` により `*Methods` インターフェース（`focus` / `blur` など）を公開する。子要素はユーザーが組み立てるが、`children` が無い場合は `Root` が既定の描画を行う。

`/** @internal */` が付き `__` で始まる props（`__percent`、`__thumb` など）は、`Root` が計算済みの状態をサブコンポーネントへ渡すための内部 API。ドキュメント化・公開はしない。

### コンポーネントごとの zustand store を React context で配る

サブコンポーネントを持つコンポーネントには `context.tsx` があり、`createStore` と、store を ref に保持して props を `setState` で同期する `<XProvider>`、そして `useXContext(selector)` を定義している。サブコンポーネントは props のバケツリレーではなく store から設定を読む。

注意: **store の中身はコンポーネント間で統一されていない。** Slider の store は設定のみ（`value` を持たない）、Knob / NumberInput は `value` を持ち、Piano / NumberInput はコールバックも持つ。この点と、framework-agnostic なコアを切り出す進行中の計画（`destroy()` を持つ Embla 型の命令的インスタンス、`scripts/publish.sh` を changesets の `fixed` へ置き換える等）は `plans/core-extraction-plan.md` に記載がある。

### インタラクション用 hooks

ポインタ / ホイール / MIDI の実体は `@tremolo-ui/dom`（`createDrag` / `createWheel` / `createMIDIAccess` など）にあり、`packages/react/src/hooks/` の hook はそれを React に橋渡しするだけ。`useDrag` / `useWheel` は ref コールバックを 1 つ返し、`useDragWithElement` は `{ refCallback, dragging }` を返す。

**ドラッグ系 hook は要素を state で保持し、生成・破棄を `useEffect` で行う。** ref コールバックの中でインスタンスを作ると、呼び出し側がインライン ref を書いた場合に再レンダーのたびに ref が付け直され（`ref(null)` → `ref(node)`）、ドラッグが中断される。

`useRefCallbackEvent` は passive でないリスナを張るための内部 hook で、現在は `usePianoDrag` からのみ使われている。`useCallbackRef` / `usePianoDrag` / `useRefCallbackEvent` は内部用（`src/index.ts` から re-export していない）で、それ以外は公開 API。`src/index.ts` に追加したものは公開 API になり、生成される typedoc にも載る。

### スタイリング

プレーンな CSS。コンポーネントごとに `index.css` を 1 つ持ち、クラス名は `tremolo-` プレフィックス。状態は ARIA 属性をセレクタとして表現する（`&[aria-disabled='true']`、`&[aria-readonly='true']`）ため、コンポーネント側で該当属性を必ず設定すること。

ドラッグ中のスタイルは 2 系統ある。`touch-action` / `user-select` / `cursor` は `createDrag` が**対象要素に直接**適用し `destroy()` で戻す（pointer capture により、ポインタが要素外へ出ても維持される）。ページ全体へ掛ける `tremolo-user-select-none` は `src/styles/global.css` にあり `src/components/_util/index.ts` が付け外しする。同ファイルの `setCursorStyle` / `resetCursorStyle` と `.tremolo-cursor-*` は**現在どこからも使われていない**（削除は CSS ヘッドレス化の判断とセットで保留中。`plans/core-extraction-plan.md` 4.5.2）。

コンポーネントの CSS を追加するときは 3 箇所の編集が必要: `src/index.ts` での import（バンドル版 `styles/index.css` 用）、`packages/react/package.json` の `exports` への `./styles/<Name>.css` 追加、`.storybook/preview.ts` での import。

### stories とテスト

Storybook の stories は `packages/react/__stories__/`、テストは `packages/react/__tests__/` に置く（`src/` の外、コンポーネント名に対応する構成）。`tsdown.config.ts` はパッケージビルドのたびに `publint`（error）と `attw`（warn）を実行するので、exports map や型解決のミスは `build:package` で失敗する。

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
