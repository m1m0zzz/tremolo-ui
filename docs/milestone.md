# 1.0 リリースまでのマイルストーン

1.0 を出すために必要な作業をまとめる。詳細な手順は各リンク先で管理する。

現在: 全パッケージ 0.5.0。破壊的変更を入れつつ 0.x に留まるため、changeset では `major` ではなく `minor` を選ぶ運用（[core-extraction-plan.md 8.3](./core-extraction-plan.md)）。

## 1. dom 切り出し

React 依存のロジックを framework-agnostic なコアへ切り出し、Vue / Svelte のラッパーを作れる状態にする。

詳細: **[core-extraction-plan.md](./core-extraction-plan.md)**

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
- [x] **テストと story を実装コードと同じディレクトリに置く。** → [core-extraction-plan.md 5.17](./core-extraction-plan.md) で完了

## 3. Vue / Svelte

- [ ] `@tremolo-ui/svelte`（action ベース。`use:drag={handlers}`。コアのシグネチャとほぼ同型なので最も薄い）
- [ ] `@tremolo-ui/vue`（composable または custom directive）

ラッパーの形はフレームワークごとに変えてよく、統一しない。

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
- [x] CSS の配布方法は決着した。**パッケージは CSS を配らない**ので、各パッケージで重複させるかという問題自体が無くなった（core-extraction-plan.md 5.1）。デモのテーマは `shared/css/` にあり、Vue / Svelte を足しても、各パートが `className` を受け取り同じ `data-*` 属性を出していれば同じものが使える

## 4. ドキュメント整備

- [x] **`@tremolo-ui/dom` のドキュメントを追加する。** typedoc の 3 つ目の plugin として追加し、サイドバーに `@tremolo-ui/dom` のカテゴリを足した。
- [x] **CSS のデモを公開する形に作り替えた。** `site/docs/tutorials/styling.mdx` を書き直し、`shared/css/` の 6 ファイルを `raw-loader` で全文タブ表示している。コピー元と、サイト / Storybook が実際に読み込むファイルは同一（core-extraction-plan.md 5.1 / 9.4）
- [x] **`PointsEditor` のドキュメントページを書く。** `site/docs/components/PointsEditor/` に追加した。複数選択（core-extraction-plan.md 5.21）と `SelectionBox` にも触れている
- [ ] **hooks のドキュメントを充実させる。** 現在 `site/docs/hooks/` には `web-midi-api` しかない。`useDrag` / `useWheel` / `useDragValue` は typedoc の自動生成のみ
- [ ] **Vue / Svelte を足したときのドキュメント構成を決める。** 現在の `site/docs/components/<Name>/index.mdx` は React 前提で、live code block も `@tremolo-ui/react` をスコープに入れている（`site/src/theme/ReactLiveScope/index.tsx`）。フレームワークごとにタブを分けるのか、サイト自体を分けるのか
- [x] **`site/i18n` の typedoc サイドバー翻訳キーを掃除した。** `sidebar.typedocSidebar.*` を en / ja とも**全て削除**した（114 キー → 7 キー）。
- [x] `site/docs/support/CHANGELOG.md` の二重管理をやめた。中身は「TODO: record from version 1.0.0」のスタブのままだったので、各パッケージの `CHANGELOG.md` と GitHub リリース、移行ガイドへのリンクに置き換えた
- [x] **その GitHub へのリンクをやめ、リリースノートをサイトに載せた。** `site/scripts/changelog.mjs` が `packages/*/CHANGELOG.md` を front matter 付きで `site/docs/changelog/<pkg>.md` に写す。typedoc の `docs/api/` と同じ扱いで、生成物はコミットしない（`site/.gitignore`。手書きの `index.md` だけ `!` で除外を戻す）
  - **`format: md` を front matter に入れるのが要点。** Docusaurus 3 の既定は `.md` も MDX として読むので、changesets が書いた文章に `<` や `{` が 1 つ紛れ込むだけでビルドが落ちる。生成物にだけ効かせられるので、サイト全体の `markdown.format` は触っていない
- [x] `format` に一本化するときに、`units` / `digit` を使っている example / story / ドキュメントを全部書き換えた（core-extraction-plan.md 5.14）
- [x] **テンプレートをモノレポに移す。** 別リポジトリ（`m1m0zzz/tremolo-ui-example-next-ts` / `m1m0zzz/tremolo-ui-example-vite-react-ts`）にあったものを、0.5.0 の API で書き直して `templates/` に入れた（決まりごとは `templates/README.md`）。破壊的変更のたびに追随を忘れる場所が増えるので、`templates/` としてこのリポジトリに入れ、**ドキュメントでは `degit` などで取り出す形をアナウンスする**（`npx degit m1m0zzz/tremolo-ui/templates/vite-react-ts`）。CI で少なくともビルドは通しておくと、破壊的変更の当たり判定になる
- [ ] **複数のタブ（ファイル）を持てる Playground を作る。** 現状の `site/src/theme/Playground/` は 1 ファイルの live code が前提で、CSS Module のような 2 つ目のファイルは `externalFiles` で外部 Playground に書き出すときにしか渡らない。iframe 化（[core-extraction-plan.md 9.7](./core-extraction-plan.md)）と一緒に検討する
- [x] **bug: styling ページの CSS Modules の部分**（`site/docs/tutorials/styling.mdx`）。例のノブが 0×0 で表示されていなかった。コンポーネントが書くのは `--knob-size` だけで、`width` / `height` はテーマ側が持つのに、例の `my-knob.module.css` にそれが無かった。ダークモードの `.dark` も `:global` が無く、module にリネームされて効いていなかった
- [x] **各コンポーネントのページに `data-*` の説明を置く。** あわせて styling ページの `data-*` の一覧表（`🚦State`）は消し、各ページへのリンクにした
- [ ] **API（props）の一部をコンポーネントのページへ移す。** typedoc の API ページは残したまま、主要な props の説明をコンポーネントのページでも読めるようにする

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

- [ ] **`functions` を汎用な関数だけにする。** 破壊的変更。詳細: **[functions-scope.md](./functions-scope.md)**

  全 63 export を「このライブラリを使わない人が使うか」で見直したところ、**入力イベントの解釈**（modifier 一式 + `applyDelta`）と**描画された鍵盤の幾何**（`piano.ts`）という汎用でない 2 つの塊が入っていた。どちらも `dom` へ移す。あわせて使用箇所ゼロの `isEmpty` / `mod` など 6 つの公開をやめる。

  移動後、`functions` は 値の分布 / 数値変換 / 音楽理論 / 表示 の 4 本になる。

- [x] **`NumberInput` の `InputField` の props を `Root` に集めた。** 破壊的変更。

- [x] **親の大きさに合わせる指定を `resizable` に揃えた。** 破壊的変更。`AnimationCanvas` の `relativeSize`、`Piano` の `fill`、`createAnimationCanvas` の `relativeSize` を `resizable` にし、`Piano` の `data-fill` も `data-resizable` にした
  - `AnimationCanvas` の props は `resizable` で切り替わる判別可能ユニオンにした（`AnimationCanvasFixedProps` / `AnimationCanvasResizableProps`）。以前はオーバーロードが 2 つあっても、どちらも `width` と `relativeSize` を同時に受け付けていて、`width` は黙って無視されていた
  - `reduceFlickering` は `AnimationCanvasCommonProps` に移した。コアでは固定サイズで `width` / `height` が変わったときにも効いていて、relative 側だけに置くのは実装と合っていなかった

- [ ] **`packages/react/AGENTS.md` の規約とずれている既存コードを揃える。** 規約を書き起こしたときに見つかったもの。規約の側を直すか、コードを揃えるかも含めて決める
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

- [ ] `FileInput` コンポーネント
- [ ] `DropZone` コンポーネント
- [x] **WavetableSynth の story を作り込む**（`packages/react/__stories__/combined/WavetableSynth/`）
  - [x] octave のコントロール
  - [x] velocity のコントロール
  - [x] MIDI キーボード
  - 鍵盤まわりを `KeyboardSection` に切り出した。octave は `noteRange` を 12 半音ずつずらす（Z / X でも動く）。velocity はマウスと PC キーボードで弾いたときの値で、MIDI キーボードは自分の velocity を使う（C / V で ±20）。どちらも `AmplitudeEnvelope.triggerAttack` の velocity に渡す
  - **MIDI は `Piano.playNote` を経由させた。** 鍵盤が光り、マウスと MIDI で同じノートを押しても 1 回だけ鳴る。Piano のコアは `noteRange` の外のノートも拒まないので、表示範囲の外を MIDI で弾いても鳴る。そのためエンベロープと音源は `noteRange` からの添字ではなくノート番号で持ち、初めて弾いたときに作る

## 8. コードベース

- [ ] **コード内のコメントとテストの説明（`describe` / `it`）を日本語にする。** 内部向けの文書と揃える。ただし公開 API の JSDoc は typedoc の API ページと IDE の補完に出て、公開ドキュメント（英語）の一部になるので、対象に含めるかを先に決める

## 1.0 の基準

以下が揃った時点で 1.0 とする。

- [x] コア切り出しが Phase 5 まで完了し、`@tremolo-ui/react` が薄いラッパーになっている
- [ ] Vue / Svelte のいずれかが公開されている（コアが framework-agnostic であることの実証）
- [x] CSS の配布方法が確定し、移行ガイドがある（5.1 / 5.2。パッケージは CSS を配らず、テーマはドキュメントで公開する）
- [ ] 公開 API が安定し、以降の破壊的変更に `major` を使う運用へ切り替えられる
