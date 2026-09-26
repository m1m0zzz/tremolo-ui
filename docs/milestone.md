# 1.0 リリースまでのマイルストーン

1.0 を出すために必要な作業をまとめる。詳細な手順は各リンク先で管理する。

現在: 全パッケージ 0.5.0。破壊的変更を入れつつ 0.x に留まるため、changeset では `major` ではなく `minor` を選ぶ運用（ルートの `AGENTS.md`「リリース」）。

## 1. dom 切り出し

React 依存のロジックを framework-agnostic なコアへ切り出し、Vue / Svelte のラッパーを作れる状態にする。

| | 状態 |
| --- | --- |
| Phase 0: 準備（changesets 移行を含む） | 完了 |
| Phase 1: `@tremolo-ui/dom` の器 + MIDI 移植 | 完了（0.3.0 でリリース済み） |
| Phase 2: `createDrag` / `createWheel` | 完了 |
| Phase 2.5: Slider / Knob / XYPad の実装統一 | 完了 |
| Phase 3: `createDragValue` | 完了 |
| Phase 4: Piano / AnimationCanvas / NumberInput | 完了 |
| Phase 5: zustand 除去 | 完了 |
| 5 章: CSS ヘッドレス化・修飾キー・単位の扱い など | 完了 |

## 2. テスト整備

- [x] **dom 移行前からテストが無い部分にテストを足す。** 全コンポーネントに専用のテストが揃った（Piano は 4.3、PointsEditor は Phase 5、XYPad は 5.7 と同時に追加）。`__tests__/drag.test.tsx` と `__tests__/Slider/compose.test.tsx` は複数コンポーネントにまたがるものとしてそのまま残す
- [x] **テストと story を実装コードと同じディレクトリに置く。**

## 3. Vue / Svelte

**Svelte → Vue の順に進める。** コアのシグネチャと最も同型な Svelte でラッパーの形とコアに足りないものを洗い出してから Vue に進む。1.0 の基準は片方で満たせる。

- [x] **準備: React に残っている framework 非依存のロジックを `dom` へ移す。** ラッパーを書く前に済ませ、3 つのフレームワークで同じロジックを重複させない
  - [x] 純粋な関数と定数。キー / ホイールの向き（`arrowKeyDirection` / `arrowKeyMove` / `wheelDirection` / `wheelMove`）、値の位置（`valuePercent`）、Knob の幾何、Slider の目盛り、NumberInput の読み取りとキャレット、`checkSteps`、入力の既定値、`cssLength` / `visuallyHiddenStyle`、`partitionByAccept`
    - **`checkSteps` は警告の文言を返すだけで、出すのはラッパー。** `process.env.NODE_ENV` の判定をラッパー側にインラインで書けば、本番では呼び出しごと `checkSteps` がバンドルから落ちる
  - [x] 状態を持つもの
    - [x] 長押しの繰り返し: `createLongPress`（`useLongPress` と NumberInput のステッパー）
    - [x] Piano のキーボードショートカット: `createPianoInput` の `keyboardShortcuts` / `keyboardShortcutsScope`。`SHORTCUTS` も dom へ
    - [x] NumberInput の下書きと確定、ステッパーのドラッグ: `numberInputRanges` / `nudgeNumberInput` / `numberInputBounds` / `commitNumberInputText` / `createStepperDrag`。下書きの文字列そのものは各ラッパーの state に置く
    - [x] PointsEditor の選択とまとめての移動: `createPointsEditor`。選択そのもの（controlled / uncontrolled）は各ラッパーの state に置き、`update({ selection })` で押し戻す
- [ ] `@tremolo-ui/svelte`
- [ ] `@tremolo-ui/vue`

**どちらも React と同等のコンポーネント一式を最初から揃える。** Root + パート + `data-*` の契約を同じにするので、`shared/css/` のテーマがそのまま使える。hook 相当（Svelte の action、Vue の composable）もあわせて出す。

ラッパーの形はフレームワークごとに変えてよく、統一しない。名前の形は各フレームワークの慣習に合わせる。

| | 書き方 | 理由 |
| --- | --- | --- |
| React | `<Knob.Root>` / `<Knob.Thumb>`（今のまま） | |
| Svelte | `<Knob.Root>` / `<Knob.Thumb>` | `export * as Knob` の名前空間にする。Bits UI と同じ形で、パートの単位でも tree-shaking が効く。Root を `<Knob>` にするには Root にパートを生やす（`Object.assign`）しかなく、それをすると名前空間にできない |
| Vue | `<Knob>` / `<KnobThumb>` | ドット付きの名前は `<script setup>` でしか使えず、グローバル登録・Nuxt の auto-import・in-DOM テンプレートでは使えない。Reka UI や Headless UI と同じくフラットにし、Root は `Root` を付けずコンポーネント名そのものにする |

### 新パッケージを追加する際の手順（Phase 1 で確立）

順序を守らないと CI が落ちる。

1. **コードを main に入れる前に**、ローカルから手動 publish（`npm publish -w packages/<name>`）
2. npm 側で trusted publisher を登録（repo: `m1m0zzz/tremolo-ui`、workflow: `release.yml`）
3. その後にコードを push し、changeset を追加

理由: `changesets/action` は `publish-script` を渡してあると **changeset が無いときにこそ publish を実行する**ため、npm 上に存在しない新パッケージが main に入った時点で E404 で落ちる。

あわせて必要になるもの:

- [ ] ローカル publish には npm へのログインが必要（普段の publish は CI の OIDC 経由なので、ローカルの authToken が失効していることがある。scoped パッケージでは未認証でも 401 ではなく E404 が返るため `npm whoami` で切り分ける）
- [x] `.changeset/config.json` の `fixed` は `[["@tremolo-ui/*"]]` のグロブなので**変更不要**
- [x] `packages/<name>/LICENSE` を置く場合、`.oxfmtrc.json` の `ignorePatterns` に `LICENSE` があること（`.prettierignore` から移行済み。oxfmt は知らない拡張子を黙って飛ばすので、prettier のときのように pre-commit が落ちることは無いはず）
- [ ] Storybook を持つパッケージなら、`packages/react/wrangler.jsonc` に倣って Worker と `tremolo-ui.mimoz.dev/i/storybook-<name>*` の Route を足し、`ci.yml` と `pull-request.yml` の**両方**にビルドとデプロイの手順を足す
- [x] CSS の配布方法は決着した。**パッケージは CSS を配らない**ので、各パッケージで重複させるかという問題自体が無くなった。デモのテーマは `shared/css/` にあり、Vue / Svelte を足しても、各パートが `className` を受け取り同じ `data-*` 属性を出していれば同じものが使える

## 4. ドキュメント整備

- [x] **`@tremolo-ui/dom` のドキュメントを追加する。** typedoc の 3 つ目の plugin として追加し、サイドバーに `@tremolo-ui/dom` のカテゴリを足した。
- [x] **CSS のデモを公開する形に作り替えた。** `site/docs/tutorials/styling.mdx` を書き直し、`shared/css/` の 6 ファイルを `raw-loader` で全文タブ表示している。コピー元と、サイト / Storybook が実際に読み込むファイルは同一
- [x] **`PointsEditor` のドキュメントページを書く。** `site/docs/components/PointsEditor/` に追加した。複数選択と `SelectionBox` にも触れている
- [x] **hooks のドキュメントを充実させた。** `site/docs/hooks/` に `useDrag` / `useWheel` / `useDragValue` のページを live example 付きで追加し、ja も書いた
  - **オプションの表もコンポーネントと同じ `<PropsTable />` で出す。** `site/scripts/api-props.mjs` の対象を `*Props` から `*Props` と `*Options` に広げた。hook にとってオプションは props と同じ意味を持つ
  - `UseDragProps` は公開していなかったので、`UseDragOptions` の名前で公開した（`UseWheelOptions` / `UseDragValueOptions` と揃う）
  - **`UseWheelOptions` が `onWheel` を継承していた。** `createWheel` は `update()` で差し替えるために持っているが、hook はハンドラを第 1 引数で受けるので、オプションで渡しても黙って無視されていた。`Omit` で外した
  - 表に出すにあたって、説明の無かったコールバックや `threshold` / `updateOnPointerDown` の JSDoc を埋めた
  - `useAnimationFrame` / `useEventListener` / `useInterval` / `useLongPress` はページを作っていない。典型的な実装以上に書くことが無く、typedoc の API ページで足りる
- [ ] **Vue / Svelte のドキュメントを同じページにタブで載せる。** `site/docs/components/<Name>/` を共通にし、例と API Reference だけを React / Svelte / Vue のタブで切り替える。`data-*` とテーマは共通なので説明も共有する。現在のページは React 前提で、live code block も `@tremolo-ui/react` をスコープに入れている（`site/src/theme/ReactLiveScope/index.tsx`）
  - Storybook は各パッケージに持たせ、別の Worker で配信する（上の「新パッケージを追加する際の手順」）
- [x] **`site/i18n` の typedoc サイドバー翻訳キーを掃除した。** `sidebar.typedocSidebar.*` を en / ja とも**全て削除**した（114 キー → 7 キー）。
- [x] `site/docs/support/CHANGELOG.md` の二重管理をやめた。中身は「TODO: record from version 1.0.0」のスタブのままだったので、各パッケージの `CHANGELOG.md` と GitHub リリース、移行ガイドへのリンクに置き換えた
- [x] **その GitHub へのリンクをやめ、リリースノートをサイトに載せた。** `site/scripts/changelog.mjs` が `packages/*/CHANGELOG.md` を front matter 付きで `site/docs/changelog/<pkg>.md` に写す。typedoc の `docs/api/` と同じ扱いで、生成物はコミットしない（`site/.gitignore`。手書きの `index.md` だけ `!` で除外を戻す）
  - **`format: md` を front matter に入れるのが要点。** Docusaurus 3 の既定は `.md` も MDX として読むので、changesets が書いた文章に `<` や `{` が 1 つ紛れ込むだけでビルドが落ちる。生成物にだけ効かせられるので、サイト全体の `markdown.format` は触っていない
- [x] `format` に一本化するときに、`units` / `digit` を使っている example / story / ドキュメントを全部書き換えた
- [x] **テンプレートをモノレポに移す。** 別リポジトリ（`m1m0zzz/tremolo-ui-example-next-ts` / `m1m0zzz/tremolo-ui-example-vite-react-ts`）にあったものを、0.5.0 の API で書き直して `templates/` に入れた（決まりごとは `templates/README.md`）。破壊的変更のたびに追随を忘れる場所が増えるので、`templates/` としてこのリポジトリに入れ、**ドキュメントでは `degit` などで取り出す形をアナウンスする**（`npx degit m1m0zzz/tremolo-ui/templates/vite-react-ts`）。CI で少なくともビルドは通しておくと、破壊的変更の当たり判定になる
- [x] **複数のタブ（ファイル）を持てる Playground を作った。** `externalFiles` に渡したファイルが Playground のタブになる。1 つ目は今までどおり編集できる live code で、2 つ目以降は読み取り専用
  - **読み取り専用なのは、プレビューがページの中で動いているから。** iframe にしないと決めたので、CSS Module をその場でコンパイルする仕組みが無い。見た目を試すなら Stackblitz / CodeSandbox へ送る（ファイルは元から渡している）
  - タブ名はファイル名。1 つ目は例によらず `index.tsx` で、残りは import した名前のまま
  - **例が `./<Name>.module.css` を import していたら、デモのテーマをタブに出す。** コンポーネントのページの例は Styling ページからコピーしたテーマに繋いであるので、その中身も読めるようにした。import 行から拾うので、ページ側に書き足すものは無い
  - タブはヘッダーの左側に置き、幅が足りなければ折り返す。テーマは長いので、読み取り専用の表示には高さの上限を付けた
  - **エディタは隠すだけでアンマウントしない。** タブを切り替えても、読者が打った内容が残る
  - styling ページで手書きしていた `<Tabs>` は外した。Playground のタブが同じことをする
- [x] **bug: styling ページの CSS Modules の部分**（`site/docs/tutorials/styling.mdx`）。例のノブが 0×0 で表示されていなかった。コンポーネントが書くのは `--knob-size` だけで、`width` / `height` はテーマ側が持つのに、例の `my-knob.module.css` にそれが無かった。ダークモードの `.dark` も `:global` が無く、module にリネームされて効いていなかった
- [x] **各コンポーネントのページに `data-*` の説明を置く。** あわせて styling ページの `data-*` の一覧表（`🚦State`）は消し、各ページへのリンクにした
- [x] **API（props）の一部をコンポーネントのページへ移す。** typedoc の API ページは残したまま、主要な props の説明をコンポーネントのページでも読めるようにする
  - Radix Primitives に倣い、各ページに **API Reference** を置いた。パートごとに、props の表（`<PropsTable of="SliderProps" />`）と data 属性の表（値と説明）を並べる。以前の「Data attributes」はここに統合した
  - **props の表は手で書かず、`site/scripts/api-props.mjs` が typedoc で JSDoc から作る。** 型・既定値・説明が実装とずれない。載せるのは独自の props だけで、`className` / `style` と、説明の無い `children` / `aria-*` は除く
  - typedoc は export された型しか拾わないので、`Knob.SVGRoot` / `Knob.Thumb` の props 型を公開し、ステッパーの props 型をエイリアスから interface にした
  - **コンポーネントのページを ja に翻訳した**（7 ページ）。props の説明の訳は `site/i18n/ja/api-props.json` に、英語の hash と一緒に持つ。英語が変わった訳は使わずに英語を出し、スクリプトが一覧を出す
  - data 属性の表は型から作れないので手書きのまま
  - **表に出すにあたって JSDoc を補強した。** 説明の無かった `value` / `min` / `max` / `step` / コールバックなどを埋め、`wheel` / `keyboard` / `externalStyles` / `step` / `angleRange` などに `@default` を足した
    - **`'raw'` の量は値の単位で、step の単位ではない。** 「shift で 1 step の 10 分の 1」と書いていたが、`step` が 1 のときしか正しくない。既定の `['raw', 1]` は `step` が 1 より大きいと丸め戻されて動かない（開発ビルドは警告する）ので、そのことも書いた
    - `SliderThumbProps.color` / `XYPadThumbProps.color` の説明が大きさの話だけで、色に触れていなかった
    - `KnobThumbProps` の「color」「percent (0-100)」のような、何の色・何の割合か分からない説明を書き直した

## 5. 開発基盤とホスティング

### デプロイ先を Cloudflare Workers / `tremolo-ui.mimoz.dev` へ移す

**完了**

### ツールチェーンの見直し

**完了**

- [x] **jest → vitest。** 
- [x] **eslint / prettier → oxlint / oxfmt。** 

## 6. 公開 API の整理

- [x] **story を args で操作できる形に揃えた。** 素の関数のまま export していた story（`AnimationCanvas` 3 / `Piano` 6 / `PointsEditor` 2 / `Slider` 3 / `XYPad` 1 / `NumberInput` 3）を Story オブジェクトにして、直書きしていた prop を args へ移した。`value` は state のまま
  - `{...args}` を撒いてある story は、args に書いていない prop も docgen 経由で Controls に出る。足りていなかったのは「素の関数で args が届いていなかったもの」だけ
  - 複数のインスタンスを並べている story は共通のものだけを args にした（`Slider` の `Flex` の `vertical`、`ConfigScale` の 3 段目の `min` / `max` / `step` は主題なので残す）
  - `src/hooks/*.stories.tsx` の 5 つは meta に `component` が無く、args を束ねる相手がいないので素の関数のまま
  - ビルドした Storybook を Playwright で全 48 story 開いて、描画されること・Storybook のエラーパネルが出ないこと・console error と pageerror が 0 件であることを確認した
  - **Controls には prop でない値も出せる。** args に入れたキーは Storybook がそのまま拾うので、`Root` 以外のパートをマウントするかどうかを args に置き、`render` で分割代入して取り出せば Controls から切り替えられる。`ComponentProps<typeof X.Root> & Parts` を `Meta` / `StoryObj` に渡し、`table: { category: 'Parts' }` で本物の prop と別の欄にまとめる。**`render` で取り出さずに `{...args}` を撒くと DOM に渡ってしまう**ので、分割代入は必須
  - 入れたのは各コンポーネントの `Basic` だけ（`Knob` の 3 パート、`NumberInput` の `Stepper`、`Slider` の `Thumb` / `Marks`、`XYPad` の `Thumb`、`PointsEditor` の `Background`）。**argTypes を meta ではなく story 側に書いた**ので、主題が別にある story の Controls は汚れない
  - **`Slider.Marks` の `options` に `'step'` を渡してはいけない場面がある。** 目盛りは `max / per - min / per + 1` 本作られるので、`['step', …]` は `step` に比例して増える。0-100 で既定の `step` = 1 なら 101 本、Controls で `step` を 0.1 にされたら 1001 本。`Basic` では固定間隔（`[25, 'mark-number']`）にした

- [x] **`functions` を汎用な関数だけにした。** 破壊的変更。詳細: **[functions-scope.md](./functions-scope.md)**

  全 63 export を「このライブラリを使わない人が使うか」で見直したところ、**入力イベントの解釈**（modifier 一式 + `applyDelta`）と**描画された鍵盤の幾何**（`piano.ts`）という汎用でない 2 つの塊が入っていた。どちらも `dom` へ移し、実装の詳細だった 6 つは公開をやめた。

  **`functions` は 値の分布（scales）・数値変換（math）・音楽理論（midi）・表示（unit）の 4 本になった。** `dom` は「入力の解釈」と「描画対象の幾何」を持つ層になり、`createDrag` / `createWheel` / `createPianoInput` と、それらが必要とする値の計算が同じ場所に揃った。

  - `selectInputEvent` は `selectModifier` の返り値のキー名を変えて返すだけの関数だったので、非公開化ではなく削除した
  - `decimalPart` を置き換えた過程で、指数表記の `step` を渡すと `Slider.Marks` のラベルが全て整数に丸められるバグも直った

- [x] **トップレベルの `types` が CJS 用の宣言ファイルを指しているのは、直さないのが正しかった。** 3 パッケージとも `"types": "dist/index.d.cts"`。`@arethetypeswrong/core` で node10 を含む全ての resolution を検証したところ、トップレベルの入口に問題は無い
  - **`exports` を見ないツールチェーンは、実行時も `main`（`dist/index.cjs`）を取る。** 型だけが ESM 用に切り替わることは無いので、CJS の宣言ファイルが付いてくるのが対応として正しい。`types` を `dist/index.d.ts` に向けると、CJS の実体に ESM の型を貼ることになって今より悪くなる
  - そもそも tsdown が出す `index.d.ts` と `index.d.cts` は、末尾の `sourceMappingURL` のコメント以外がバイト単位で同一。`export =` も default export も無いため、どちらを指しても利用者に渡る型は変わらない
  - attw が唯一挙げるのは `@tremolo-ui/react` の `./compose-refs` が node10 で解決できないことだが、これは `packages/react/tsdown.config.ts` のコメントどおり対象外（公開サブパスは `exports` 前提）

- [x] **`NumberInput` の `InputField` の props を `Root` に集めた。** 破壊的変更。

- [x] **親の大きさに合わせる指定を `resizable` に揃えた。** 破壊的変更。`AnimationCanvas` の `relativeSize`、`Piano` の `fill`、`createAnimationCanvas` の `relativeSize` を `resizable` にし、`Piano` の `data-fill` も `data-resizable` にした
  - `AnimationCanvas` の props は `resizable` で切り替わる判別可能ユニオンにした（`AnimationCanvasFixedProps` / `AnimationCanvasResizableProps`）。以前はオーバーロードが 2 つあっても、どちらも `width` と `relativeSize` を同時に受け付けていて、`width` は黙って無視されていた
  - `reduceFlickering` は `AnimationCanvasCommonProps` に移した。コアでは固定サイズで `width` / `height` が変わったときにも効いていて、relative 側だけに置くのは実装と合っていなかった

- [x] **`packages/react/AGENTS.md` の規約とずれている既存コードを揃える。** 規約を書き起こしたときに見つかったもの。規約の側を直すか、コードを揃えるかも含めて決める
  - [x] **公開する型がコンポーネント名で始まっていない。** 破壊的変更。`src/index.ts` に並べると、どのコンポーネントの型か分からない → **すべて揃えて**
    - `AnimationCanvas`: `CommonProps` / `AbsoluteSizingProps` / `RelativeSizingProps`
    - `NumberInput`: `StepperProps` / `IncrementStepperProps` / `DecrementStepperProps`。`NumberInputFieldProps` はパート名が `InputField` なので、規約どおりなら `NumberInputInputFieldProps` になる
    - `PointsEditor`: `PointProps`
    - `Slider`: `MarksProps` / `MarksOptionProps`
  - [x] **`AnimationCanvas` だけが compound でない。** `{ Root }` をまとめたオブジェクトではなく、コンポーネントそのものを export している。ref も受けない（内部の要素は `useDrag` と同じ理由で state に持つ） → **refは対応。compoundにしない**
  - [x] **`PointsEditorContextValue` を公開している。** 他のコンポーネントは `use<Component>Context` だけを公開し、`<Component>ContextValue` は公開していない。→ **他のコンポーネントも公開する側に揃える**
  - [x] **story のファイル名が揃っていない。** `Root` の story は `<Component>.stories.tsx` にしているが、`Knob` だけ `Root.stories.tsx`。`NumberInput` のパートは `NumberInputInputField.stories.tsx` / `NumberInputStepper.stories.tsx` とコンポーネント名が付いている
  - [x] **`Basic` が無い story がある。** `Knob/SVGRoot`（`PaintOrder`）/ `NumberInput` の `InputField`（`SelectOnFocus` ほか）/ `PointsEditor/Background`（`Graph`）/ `PointsEditor/Container`（`Inset`）/ `Slider/Marks`（`FromOptions` ほか）。どれも主題の story だけがある。名前だけ変えるのか、素の形を見せる `Basic` を足すのか決める → **特別なpropsを持っているならばBasicを足す(html要素のpropsのみなら足さない)**
  - [x] **公開している hook に story が無い。** `useAnimationFrame` / `useDragValue` / `useEventListener` / `useInterval` / `useLongPress` → {いらない / いる / いらない / いらない / いる }
  - [x] **テストファイル名の書き方が決まっていない。** `long-press.test.tsx` のような kebab-case と、`stepperDrag.test.tsx` / `__tests__/util/checkSteps.test.tsx` のような camelCase が混ざっている。規約を決めてから揃える → **そのコンポーネント用のテストならComponentName、複合ならkebab-case**
    - `packages/dom` / `packages/functions` も同じ考え方で揃えた。テストは実装のファイル名に合わせ（`drag-value.test.ts` / `drag-value.scale-jump.test.ts` / `scales.apply-delta.test.ts` / `index.test.ts`）、中身が modifier の型と関数だけだった `functions/src/types.ts` は `modifiers.ts` にした

## 7. コンポーネントと story の追加

- [x] **`FileInput` コンポーネント。** 選ばれたファイルを `File[]` として渡すところまでを持ち、読み込みとデコードは利用者に任せる
  - **`accept` は受け取るときにもう一度照合する。** ブラウザはこの属性をピッカーへのヒントとしてしか扱わず、「すべてのファイル」に切り替えられる。一致しないものは `onReject` へ回すので、黙って何も起きない代わりに理由を出せる
  - 同じファイルを 2 回選んでも動く。ファイル入力は選択が変わらないと `change` を発火しないので、読み取った時点で value を空にする
  - **コントロールはネイティブの `<input type="file">` のまま。** 見えない位置に置くがタブ順には残し、`Trigger` をその `<label>` にした。クリックがピッカーへ届くのも名前が付くのもブラウザの仕事になる
  - `accept` の照合（`matchesAccept`）は `dom` に置いた。DropZone と共有する
- [x] **`DropZone` コンポーネント。** ドロップされたファイルを `File[]` として渡す領域。`FileInput` と同じところで止まる
  - **ドロップを受け取る仕事は `dom` の `createDropZone` に置いた。** `packages/react/AGENTS.md` の「新しいインタラクションもまずコアに書く」に沿う。Svelte の DropZone が enter/leave のカウントと `accept` の照合を書き直さずに済む
  - **`useDropZone` を公開 hook にした。** 描くものは `div` 1 つなので、波形表示や canvas をそのままドロップ先にできる形が要る。`DropZone.Root` はこの hook を包んで `data-*` を出すだけ
  - 子要素をまたぐと `dragleave` が誤発火するので enter/leave を数える。別の場所で終わったドラッグ（Esc、ウィンドウ外）は `dragleave` を送らないので、document の `dragend` / `drop` で状態を戻す
  - **拒否するときもドロップはキャンセルする。** 処理されないドロップはブラウザがページを離れてファイルを開いてしまう
  - ドラッグ中はファイル名が読めない（`DataTransferItem` はタイプだけ）ので、拡張子で書いた `accept` は `[data-invalid]` の判定に使えない。判定不能として扱い、ドロップ時に判定する
- [x] **WavetableSynth の story を作り込む**（`packages/react/__stories__/combined/WavetableSynth/`）
  - [x] octave のコントロール
  - [x] velocity のコントロール
  - [x] MIDI キーボード
  - 鍵盤まわりを `KeyboardSection` に切り出した。octave は `noteRange` を 12 半音ずつずらす（Z / X でも動く）。velocity はマウスと PC キーボードで弾いたときの値で、MIDI キーボードは自分の velocity を使う（C / V で ±20）。どちらも `AmplitudeEnvelope.triggerAttack` の velocity に渡す
  - **MIDI は `Piano.playNote` を経由させた。** 鍵盤が光り、マウスと MIDI で同じノートを押しても 1 回だけ鳴る。Piano のコアは `noteRange` の外のノートも拒まないので、表示範囲の外を MIDI で弾いても鳴る。そのためエンベロープと音源は `noteRange` からの添字ではなくノート番号で持ち、初めて弾いたときに作る

## 1.0 の基準

以下が揃った時点で 1.0 とする。

- [x] コア切り出しが Phase 5 まで完了し、`@tremolo-ui/react` が薄いラッパーになっている
- [ ] Vue / Svelte のいずれかが公開されている（コアが framework-agnostic であることの実証）
- [x] CSS の配布方法が確定し、移行ガイドがある（パッケージは CSS を配らず、テーマはドキュメントで公開する）
- [ ] 公開 API が安定し、以降の破壊的変更に `major` を使う運用へ切り替えられる
