# codex レビュー: ドキュメントサイト（site）

- 実行日時: 2026-09-08 22:41 (JST)
- 対象: `site/`
- コミット: `8cc8371`
- 実行: `codex exec --sandbox read-only`（codex-cli 0.153.4）
- 最終確認: 2026-09-10 (`a93d98f`)

---

## 対応状況

| 状況 | 件数 |
| --- | --- |
| 対応済み | 12 |
| 対応する（未対応） | 3 |
| 要判断 | 0 |
| 対応しない | 1 |
| 未判断 | 0 |

全 P1 / P2 / P3 を判定済み。P1 は再現の有無まで確認した。

---

### [P1] TypeDoc が公開エントリポイントではなく内部モジュールを API として公開している — site/docusaurus.config.ts:48

> **状況: 対応済み** — 各パッケージの `src/index.ts` だけを entry point とし、公開 API を kind 別に分類するよう変更した。内部だけの symbol は生成対象から外れた。

**何が問題か**

`dom` は公開 barrel を明示的に除外し、内部の全ファイルをエントリポイントにしています。`react` も各コンポーネントの実装モジュールを直接参照しています。

```ts
entryPoints: ['../packages/dom/src/**/*.ts'],
exclude: ['../packages/dom/src/index.ts'],
```

```ts
entryPoints: [
  '../packages/react/src/components/**/index.{ts,tsx}',
  '../packages/react/src/hooks/**/*.{ts,tsx}',
],
```

例えば `packages/dom/src/canvas/context.ts:39` の以下は実装モジュールから export されていますが、`packages/dom/src/index.ts:9-15` からは公開されていません。

```ts
export function readDrawingState(...)
export function writeDrawingState(...)
export function applyDevicePixelRatio(...)
```

同様に React の各実装モジュールは `Root` や `useKnobContext` を export していますが、パッケージの公開入口 `packages/react/src/index.ts:10` は `Knob` namespace のみを公開しています。

**どう壊れるか**

API ページを見て `import { Root } from '@tremolo-ui/react'` や `import { readDrawingState } from '@tremolo-ui/dom'` と書いても、パッケージの `exports` からは取得できません。ドキュメントが「TypeScript ファイルから export されているもの」と「npm パッケージの公開 API」を混同しています。

**対応案**

TypeDoc の `entryPoints` を各パッケージの `src/index.ts` に変更してください。ページをモジュール別に分けたい場合は、公開 barrel を基準に `@category` などで分類するか、公開用のサブエントリポイントを明示的に用意します。

### [P1] 外部 Playground が例に必要な CSS と関連ファイルを渡していない — site/src/theme/Playground/external/stackblitz/files.ts:191

> **状況: 対応済み** — 両方のプロジェクトへサイトのテーマ CSS と import を追加し、Playground が例固有の関連ファイルを渡せるようにした。CSS Modules 例は `my-knob.module.css` を同梱する。

**何が問題か**

StackBlitz に渡す固定ファイルは次だけで、サイトが例に適用しているテーマ CSS を含みません。

```ts
export const files = {
  'src/main.tsx': main,
  'src/vite-env.d.ts': viteEnv,
  '.gitignore': gitIgnore,
  'eslint.config.js': eslintConfig,
  'index.html': indexHtml,
  'package.json': packageJson,
  // ...
}
```

一方、サイト上では `site/docusaurus.config.ts:163-173` により `Knob.css`、`Slider.css`、`XYPad.css` などがグローバルに読み込まれています。CodeSandbox 側の `site/src/theme/Playground/external/codesandbox/files.ts:72-84` にもこれらはありません。

さらに CSS Modules の例は `site/examples/tutorials/styling/css-module.tsx:6` で次を import しますが、外部プロジェクトには当該ファイルが追加されません。

```ts
import myKnob from './my-knob.module.css'
```

**どう壊れるか**

「Open in StackBlitz」「Open in CodeSandbox」を押すと、通常の Slider/XYPad などはドキュメント上と異なり、サイズや背景のないほぼ不可視の状態になります。CSS Modules の例は `my-knob.module.css` を解決できずコンパイルエラーになります。

**対応案**

Playground にコードだけでなく付随ファイル一覧を渡せるようにし、通常例には必要なテーマ CSS と import を、CSS Modules 例には `my-knob.module.css` を含めてください。対応できない例では外部 Playground ボタンを表示しない選択肢もあります。

### [P2] `start:fast` はクリーン checkout では API sidebar を import できない — site/package.json:9

> **状況: 対応しない** — `start:fast` は、通常の `npm run docs` などで一度生成したAPIを更新せずに再利用するための開発用コマンドであり、クリーンcheckoutからの起動は契約に含めない。

**何が問題か**

高速起動は TypeDoc を無効化します。

```json
"start:fast": "npm run changelog && SKIP_API=true docusaurus start"
```

`site/docusaurus.config.ts:18-21` も `SKIP_API` 時には生成処理を登録しません。一方、`site/sidebars.ts:1-3` は生成される CJS を無条件に import します。

```ts
import typedocSidebarDom from './docs/api/dom/typedoc-sidebar.cjs'
import typedocSidebarFunctions from './docs/api/functions/typedoc-sidebar.cjs'
import typedocSidebarReact from './docs/api/react/typedoc-sidebar.cjs'
```

しかも `site/.gitignore:1` は `docs/api` 全体を除外しています。

**どう壊れるか**

新規 clone や `site/docs/api` を消した環境で `npm run docs:fast` を実行すると、`typedoc-sidebar.cjs` が存在しないためモジュール解決に失敗します。実行による再現確認は指示に従い未検証ですが、必要ファイルが Git 管理外で生成もスキップされることは静的に確認できます。

**対応案**

`SKIP_API` 時は API sidebar 自体を追加しない、空の fallback sidebar を使う、または sidebar CJS だけを追跡対象にするなど、生成物がない状態を明示的に扱ってください。

### [P2] 5 つのコンポーネントページの Style リンクが存在しないファイルを指す — site/docs/components/Knob/index.mdx:12

> **状況: 対応済み** — Knob、NumberInput、Piano、Slider、XYPadのリンク先を、実際に共有テーマを置いている`site/src/css/tremolo/*.css`へ変更した。

**何が問題か**

Knob ページは次のリンクを生成します。

```mdx
<StyleGitHubLink
  path='packages/react/src/components/Knob/index.css'
/>
```

同じ指定が NumberInput、Piano、Slider、XYPad にありますが、いずれの `packages/react/src/components/*/index.css` も存在しません。現在のテーマは `site/src/css/tremolo/*.css` にあります。

**どう壊れるか**

各ページの「Style」をクリックすると GitHub の 404 ページになります。外部リンクなので `onBrokenLinks: 'throw'` でも検出されません。

**対応案**

リンク先を `site/src/css/tremolo/Knob.css` などへ変更してください。共通 helper でコンポーネント名からテーマのパスを生成すると再発を防げます。

### [P2] migration の末尾が同じページの現行説明と正反対 — site/docs/guides/migration.mdx:482

> **状況: 対応済み** — 現在と逆のCSS配布予定を記した`Still to come`節を削除した。

**何が問題か**

同ページの `:237-255` は正しく「パッケージは CSS を配らない」と説明していますが、末尾では次の古い説明が残っています。

```md
## Still to come

The CSS is not headless yet: `@tremolo-ui/react` ships `index.css` files and
you are expected to import them.
```

現在の `packages/react/package.json:73-84` の `exports` は `"."` だけで、CSS の export はありません。

**どう壊れるか**

移行手順を最後まで読んだ利用者は、削除済みの `index.css` を import する必要があると誤認します。実際に追加するとモジュール解決エラーになります。

**対応案**

`Still to come` セクションを削除してください。過去の計画として残す必要がある場合も、「完了済み」であることと該当バージョンを明記します。

### [P2] 日本語の Styling が英語版の現在の CSS 契約に追随していない — site/i18n/ja/docusaurus-plugin-content-docs/current/tutorials/styling.mdx:40

> **状況: 対応済み** — 英語版にある状態属性、カスタムプロパティ一覧、`--percent`によるfill描画の説明を日本語版へ同期した。

**何が問題か**

日本語版の状態表は `data-flipped`、`data-fill`、`data-selected`、`Slider.Marks` の `data-vertical` を含みません。

```md
| `[data-dragging="true"]` | `Knob` / `PointsEditor.Point` | ドラッグ中 |
| `[data-vertical="true"]` | `Slider` / `Slider.Track` / `Slider.MarksOption` | 縦向きのスライダー |
| `[data-active="true"]` | `Piano` の鍵盤 | その音が鳴っている |
```

英語版 `site/docs/tutorials/styling.mdx:50-55` にはそれらがあります。また英語版 `:66-123` の「Custom properties」節が、日本語版では丸ごと欠落し、`:62` でテーマ紹介へ進んでいます。

**どう壊れるか**

日本語利用者は、現在の headless API の主要なスタイリング手段である `--percent` やサイズ用 custom properties、選択状態などを知ることができません。英語版と日本語版で実装可能な見た目が変わります。

**対応案**

英語版の見出し・表・コードブロックを基準に日本語版を同期してください。翻訳 CI で見出し構造やコードブロック数の差を検査すると、今後の取りこぼしを検出できます。

### [P2] Playground のキーボードフォーカスが視覚的に消える — site/src/theme/Playground/styles.module.css:40

> **状況: 対応済み** — Playgroundのボタンとリンクへ、テーマのprimary colorを使った`:focus-visible` outlineを追加した。

**何が問題か**

ボタンとリンクに共通するクラスでブラウザ標準 outline を消しています。

```css
.iconButton {
  outline: 0px;
  /* ... */

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: var(--ifm-link-hover-color);
  }
}
```

代替の `:focus` / `:focus-visible` スタイルはありません。

**どう壊れるか**

Tab キーで StackBlitz、CodeSandbox、GitHub、コピー、コード表示ボタンへ移動しても、現在位置を視覚的に判別できません。hover できないキーボード利用者に直接影響します。

**対応案**

`outline: 0` を削除するか、十分なコントラストの `:focus-visible` outline を追加してください。ボタンと `<a>` の両方に適用されることも確認します。

### [P2] ライブ例の slider/spinbutton にアクセシブルネームがない — site/examples/components/knob/basic.tsx:19

> **状況: 対応済み** — Knob、Slider、NumberInputの全ライブ例へ用途に応じたアクセシブルネームを追加し、XYPadの例にもx / yそれぞれの名前を指定した。

**何が問題か**

Knob の例は値と範囲だけを渡しています。

```tsx
<Knob.Root
  value={value}
  min={0}
  max={100}
  size={50}
  onChange={(v) => setValue(v)}
>
```

同様に Slider の `Root`、NumberInput の `InputField` にも `aria-label` または `aria-labelledby` がありません。これらは実装上 `role="slider"` / `role="spinbutton"` を持ちますが、近くの見出しや単独表示された数値は自動的には名前になりません。

**どう壊れるか**

スクリーンリーダーでは「slider, 64」「spin button, 64」のように用途不明のコントロールとして読み上げられます。公開例をコピーした利用者のアプリにも同じ問題が持ち込まれます。

**対応案**

例ごとに意味のある名前を追加してください。例えば `<Knob.Root aria-label="Gain">`、`<Slider.Root aria-label="Hue">`、`<NumberInput.InputField aria-label="Frequency">` とします。

### [P2] Tone を全ライブ例の scope に載せ、Piano は render ごとに音源を生成する — site/src/theme/ReactLiveScope/index.tsx:2

> **状況: 対応済み** — Toneの共通scopeは現状維持とし、Piano例のPolySynthをeffectごとに一度だけ生成するrefへ移した。cleanupで発音を止めて`dispose()`し、再描画や再マウントでAudioNodeを残さない。

**何が問題か**

`Tone` は Piano の例だけで使われますが、全ライブコード共通 scope に静的 namespace import されています。

```ts
import * as Tone from 'tone'

const ReactLiveScope = {
  // ...
  Tone,
}
```

さらに `site/examples/components/piano/basic.tsx:9-10` は component body で毎回音源を作ります。

```tsx
function App() {
  const synth = new Tone.PolySynth({ volume: -6 }).toDestination()
```

cleanup の `dispose()` もありません。外部 StackBlitz テンプレートは `site/src/theme/Playground/external/stackblitz/files.ts:6-9` で `<StrictMode>` を使用します。

**どう壊れるか**

Knob や Slider だけのページでも Tone がライブコード用チャンクへ取り込まれます。また Piano の再描画・再マウント・編集のたびに AudioNode が追加され、古い音源が破棄されません。

**対応案**

Tone は Piano 例を開いたときだけ動的にロードしてください。音源は `useRef` または lazy state で一度だけ生成し、`useEffect` cleanup で `dispose()` します。

### [P2] “Headless UI” の紹介が「rich default UI」を提供すると説明している — site/src/components/HomepageFeatures/index.tsx:29

> **状況: 対応済み** — 「CSS は同梱せず、マークアップと ARIA / data 属性、操作ロジックを提供する」という文面へ英語・日本語とも書き換えた。

**何が問題か**

トップページは次の説明を表示します。

```ts
{
  id: 'headless-ui',
  title: 'Headless UI',
  description:
    'It provides a rich default UI and a DOM-like component system that is easy to customize.',
},
```

これは `site/docs/tutorials/styling.mdx:20` の「tremolo-ui ships no CSS」や、サイト側がデモ CSS を注入している `site/docusaurus.config.ts:165-172` と矛盾します。日本語訳にも同じ「リッチなデフォルトUI」があります。

**どう壊れるか**

利用者はパッケージを入れるだけで完成した見た目が得られると期待します。実際には CSS がなく、特に Slider や XYPad はサイズ・背景・thumb の見た目を利用者が与える必要があります。

**対応案**

「DOM/ARIA/data 属性と操作ロジックを提供し、外観は利用者が定義する」ことを前面に出す文面へ変更してください。

### [P3] `AnimationCanvasProps` のリンク先が別 interface — site/docs/components/AnimationCanvas/index.mdx:32

> **状況: 対応済み** — kind 別に生成した `AnimationCanvasProps`、sizing interface、`CommonProps.animate` の各ページへリンクを更新した。

**何が問題か**

ラベルは `AnimationCanvasProps` ですが、リンクは `AbsoluteSizingProps` のアンカーです。

```md
ref: [AnimationCanvasProps](/docs/api/react/components/AnimationCanvas/#absolutesizingprops)
```

**どう壊れるか**

リンクを押すと props 全体ではなく絶対サイズ用の `width` / `height` interface に移動します。

**対応案**

リンク先を `#animationcanvasprops` に変更してください。

### [P3] 外部 Playground の依存バージョンが再現不能な `latest` — site/src/theme/Playground/external/stackblitz/files.ts:97

> **状況: 対応する（未対応）** — `latest` だと、後から開いたときに再現しない。

**何が問題か**

StackBlitz は次の指定を使います。

```json
"@tremolo-ui/react": "latest",
"react": "^19",
"react-dom": "^19",
"tone": "^15"
```

CodeSandbox 側も `@tremolo-ui/react` と `react-scripts-ts` を `latest` にしています。

**どう壊れるか**

同じ公開済みドキュメントから同じボタンを押しても、実行日によってインストールされる API やツールチェーンが変わります。古い docs のコードと将来の `latest` が一致する保証もありません。

**対応案**

サイトが対象とする tremolo-ui と React の互換バージョンを固定してください。少なくとも docs のデプロイ時に package version を注入し、同じ内容を再現できるようにします。

### [P3] トップページの依存関係説明が現行 package と一致しない — site/docs/index.md:15

> **状況: 対応する（未対応）** — 「minimal dependences (clsx, zustand)」と書いてあるが、どちらも既に依存していないことを確認した。

**何が問題か**

英語・日本語とも次の説明が残っています。

```md
- minimal dependences (clsx, zustand)
```

現在の `packages/react/package.json:42-44` の runtime dependencies は `@tremolo-ui/dom` と `@tremolo-ui/functions` で、`clsx` と `zustand` は含まれていません。

**どう壊れるか**

依存サイズやアーキテクチャを判断する利用者に、現在は使っていない外部ライブラリを使用していると伝えてしまいます。

**対応案**

依存名の列挙を更新するか、「外部 runtime dependency を持たず、内部の dom/functions パッケージだけに依存する」など、package manifest と一致する説明にしてください。`dependences` は `dependencies` に直します。

### [P3] トップの API/コンポーネント導線が公開面を網羅していない — site/docs/index.md:29

> **状況: 対応する（未対応）**

**何が問題か**

API 一覧には functions と react しかありません。

```md
- [@tremolo-ui/functions](./api/functions/)
- [@tremolo-ui/react](./api/react/)
```

`@tremolo-ui/dom` には TypeDoc sidebar がありながら、ここにも footer にもリンクがありません。また `packages/react/src/index.ts:31-41` で公開されている `PointsEditor` だけ、`site/docs/components/` に手書きガイドと例がありません。

**どう壊れるか**

`@tremolo-ui/dom` や `PointsEditor` の存在を知らない利用者は、トップの通常導線から発見しにくくなります。

**対応案**

API 一覧と footer に DOM を追加し、PointsEditor に他コンポーネントと同形式の概要・import・ライブ例ページを追加してください。

### [P3] トップページの SVG が装飾か情報画像か判別できず、ロゴの代替文も不正確 — site/src/components/HomepageFeatures/index.tsx:39

> **状況: 対応済み** — feature の挿絵は見出しと本文が内容を持つため装飾として扱い、`aria-hidden="true"` と `focusable="false"` を指定した。navbar の alt は `tremolo-ui` にし、en / ja の navbar.json も合わせた。

**何が問題か**

各 feature の SVG は `role="img"` だけで、コンポーネント側に名前がありません。

```tsx
<div className="text--center">
  <Svg className={styles.featureSvg} role="img" />
</div>
```

少なくとも `undraw_compose_music.svg` と `undraw_web_development.svg` には `<title>` がありません。また navbar の alt は `site/docusaurus.config.ts:208-210` で汎用文言のままです。

```ts
logo: {
  alt: 'My Site Logo',
  src: emojiUrl('🎸', 'svg'),
},
```

**どう壊れるか**

スクリーンリーダーに名前のない画像として露出するか、tremolo-ui のロゴを「My Site Logo」と読み上げます。

**対応案**

feature 画像が装飾なら `aria-hidden="true"` と `focusable="false"` を指定してください。情報を持たせるなら翻訳可能な `aria-label` / `<title>` を付けます。navbar alt は `tremolo-ui` などへ変更します。

### [P3] favicon helper が複合 emoji のコードポイントを切り捨てる — site/docusaurus.config.ts:12

> **状況: 対応済み** — favicon / navbar のロゴも `src/rehype/twemoji.ts` の `toCodePoint` / `toUrl` を通すようにして、先頭のコードポイントだけを使う実装をやめた。CDN の `latest` もインストール済みの `@twemoji/api` の版に固定した（package.json から読むので依存を上げれば追従する）。

**何が問題か**

Twemoji のコードポイント列から最初の要素だけを使っています。

```ts
const codePoint = twemoji.convert.toCodePoint(emoji)
return emojiBaseUrl + `/${fmt}/${codePoint.split('-')[0]}.${format}`
```

**どう壊れるか**

現在の `🎸` は単一コードポイントなので動きますが、例えば `👩‍💻` に変更すると、本来必要な ZWJ を含むコードポイント列ではなく最初の `👩` の画像 URLになります。また URL は `@latest` に依存しており、ビルド内容を変えずに配信先が変化します。

**対応案**

`split('-')[0]` を削除し、`site/src/rehype/twemoji.ts:43-56` の既存 `toCodePoint` / `toUrl` を共用してください。CDN の `latest` も導入済み Twemoji バージョンへ固定するのが安全です。

## まとめ

- P1: 2 件
- P2: 8 件
- P3: 6 件

優先順位は次のとおりです。

1. 外部 Playground に CSS・CSS Modules ファイルを含め、表示不能／コンパイル不能な例を直す
2. TypeDoc を各パッケージの公開 `src/index.ts` 基準にし、利用不能な内部 export を API から外す
3. migration 末尾の「CSS を配布している」という逆向きの説明を削除する

`site/examples` の通常の props・namespace 名については、今回確認した範囲で現行の公開 API に存在しない名前は見つかりませんでした。指定に従い、テスト・TypeScript 実行・Docusaurus ビルドは行っていません。
