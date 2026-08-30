# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

tremolo-ui は Web Audio アプリ向けの headless なコンポーネントライブラリ。npm workspaces のモノレポから 2 つのパッケージを公開している。Node >= 22（`.nvmrc` は 24 を固定）、`.npmrc` で `engine-strict=true`。

| ワークスペース | パッケージ | 内容 |
| --- | --- | --- |
| `packages/functions` | `@tremolo-ui/functions` | 純粋関数のみ（math / midi / util）。`sideEffects: false` |
| `packages/react` | `@tremolo-ui/react` | 全コンポーネント + hooks。依存は `@tremolo-ui/functions` / `clsx` / `zustand` |
| `site` | private | Docusaurus ドキュメントサイト（en / ja） |

## コマンド

特記がなければリポジトリルートで実行する。

```bash
npm run test                  # 全ワークスペース
npm run test -w packages/functions
npm run test -w packages/react
npm run build:package         # 全ワークスペース（tsc --emitDeclarationOnly + tsdown）
npm run lint                  # eslint .（自動修正は lint:fix）
npm run format                # prettier . --write
npm run sb -w packages/react  # Storybook 開発サーバ（:6006）
npm run typecheck -w packages/react
```

単一テストファイルの実行（jest / ts-jest preset / jsdom）:

```bash
npm run test -w packages/functions -- __tests__/math.test.ts
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

**site は workspace の symlink 経由でパッケージのビルド済み `dist/` を参照している。** `packages/*/src` を変更したら、site（やドキュメントの example）に反映する前に `npm run build:package` が必要。`react` から `functions` の新しいコードを使う場合も同様。

## アーキテクチャ

### namespace オブジェクトによる compound component

各コンポーネントのディレクトリ（`packages/react/src/components/<Name>/`）は単一のコンポーネントではなくプレーンなオブジェクトを export する。例: `Slider = { Root, Thumb, Track, Scale, ScaleOption }`、`Knob = { Root, SVGRoot, InactiveLine, ActiveLine, Thumb }`。`Root` は `forwardRef` で、`useImperativeHandle` により `*Methods` インターフェース（`focus` / `blur` など）を公開する。子要素はユーザーが組み立てるが、`children` が無い場合は `Root` が既定の描画を行う。

`/** @internal */` が付き `__` で始まる props（`__percent`、`__thumb` など）は、`Root` が計算済みの状態をサブコンポーネントへ渡すための内部 API。ドキュメント化・公開はしない。

### コンポーネントごとの zustand store を React context で配る

サブコンポーネントを持つコンポーネントには `context.tsx` があり、`createStore` と、store を ref に保持して props を `setState` で同期する `<XProvider>`、そして `useXContext(selector)` を定義している。サブコンポーネントは props のバケツリレーではなく store から設定を読む。

注意: **store の中身はコンポーネント間で統一されていない。** Slider の store は設定のみ（`value` を持たない）、Knob / NumberInput は `value` を持ち、Piano / NumberInput はコールバックも持つ。この点と、framework-agnostic なコアを切り出す進行中の計画（`destroy()` を持つ Embla 型の命令的インスタンス、`scripts/publish.sh` を changesets の `fixed` へ置き換える等）は `plans/core-extranction-plan.md` に記載がある。

### インタラクション用 hooks

`packages/react/src/hooks/` にポインタ / キーボード / MIDI のプリミティブがある。`useDrag` / `useDragWithElement` は `[refCallback, pointerDownHandler]` を返す。`useRefCallbackEvent` は passive でないリスナを張るために存在する。`useCallbackRef` / `usePianoDrag` / `useRefCallbackEvent` は内部用（`src/index.ts` から re-export していない）で、それ以外は公開 API。`src/index.ts` に追加したものは公開 API になり、生成される typedoc にも載る。

### スタイリング

プレーンな CSS。コンポーネントごとに `index.css` を 1 つ持ち、クラス名は `tremolo-` プレフィックス。状態は ARIA 属性をセレクタとして表現する（`&[aria-disabled='true']`、`&[aria-readonly='true']`）ため、コンポーネント側で該当属性を必ず設定すること。ドラッグ中の body レベルのスタイル（`tremolo-user-select-none`、`tremolo-cursor-*`）は `src/styles/global.css` にあり、`src/components/_util/index.ts` が付け外しする。

コンポーネントの CSS を追加するときは 3 箇所の編集が必要: `src/index.ts` での import（バンドル版 `styles/index.css` 用）、`packages/react/package.json` の `exports` への `./styles/<Name>.css` 追加、`.storybook/preview.ts` での import。

### stories とテスト

Storybook の stories は `packages/react/__stories__/`、テストは `packages/react/__tests__/` に置く（`src/` の外、コンポーネント名に対応する構成）。`tsdown.config.ts` はパッケージビルドのたびに `publint`（error）と `attw`（warn）を実行するので、exports map や型解決のミスは `build:package` で失敗する。

## 規約

- ESLint が `import/order` を強制する。グループごとにアルファベット順、グループ間は空行。`@tremolo-ui/**` は external グループ扱い、CSS の import は最後。`no-unused-vars` は先頭 `_` を許容。
- husky + lint-staged により、コミットごとに Prettier と eslint --fix が走る。
- `.cspell.json` を使用しているため、新しいドメイン用語は追加が必要になる場合がある。

## リリース

`./scripts/publish.sh <patch|minor|major>` が、`functions` を bump → `react` の依存を新バージョンへ更新 → `react` を bump → `publish: <version>` でコミット → `v<version>` タグを作成 → push まで行う。`.github/workflows/release.yml` がそのタグを検知し、npm trusted publishing（OIDC）で両パッケージを publish する。2 つのパッケージは常に同一バージョンでリリースされる。
