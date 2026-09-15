# AGENTS.md（packages/react）

`@tremolo-ui/react` の中だけで効く決まりごと。スタイリング（`data-*` / ARIA / テーマ）、公開 API と `/* @__PURE__ */`、ファイル名の大文字小文字は、`site` や他のパッケージにもまたがるのでルートの `AGENTS.md` にある。

## コンポーネント

- 各コンポーネントのディレクトリは、単一のコンポーネントではなく `Root` などをまとめたプレーンなオブジェクトを export する
  - **`AnimationCanvas` だけはコンポーネントそのものを export する。** 描くのは `<canvas>` 1 つで、分けるパートが無いため。ref はその `<canvas>` に渡す
- **children はそのまま描画し、既定の描画へフォールバックしない。** `Root` の `children` は型で必須。サブコンポーネントの `children` はその要素の中身として描かれるだけで、要素そのものを差し替えることはない（`children` の有無で描き分けると、`className` / `style` / ref の行き先が変わって黙って落ちる）
- **Piano だけはサブコンポーネントを持たない。** 鍵盤は `Root` が描き、per-key のカスタマイズはコールバックで受ける（判断の経緯はルートの `docs/core-extraction-plan.md` 5.5）。children による合成に戻さないこと
- サブコンポーネントは props のバケツリレーではなく `context.tsx` から読む。**中身は素の React context だけで、外部ストアも同期する state も置かない。** `useEffect(..., [props])` で流し込む形は、値が変わったフレームで古い値を返す不具合を生んで除去した経緯がある（同 Phase 5）
- **`Root` は `export const Root = forwardRef(...)` の形で export すること。** react-docgen は export されたコンポーネント定義しか拾わないため、`const Root` のままだと Controls パネルに props が 1 つも出ない
- **peer に React 18 を含むので、ref を受けるパートも `forwardRef` で書く**（React 19 の ref-as-prop に頼らない）。足したら `__tests__/forward-refs.test.ts` に加える

## インタラクション用 hooks

ポインタ / ホイール / MIDI の実体は `@tremolo-ui/dom` にあり、`src/hooks/` はそれを React に橋渡しするだけ。**新しいインタラクションもまずコアに書く**（設計の意図はルートの `docs/core-extraction-plan.md` Phase 3）。React の外から非同期に変わる状態を購読しているのは `useMIDIAccess` だけ。

## 内部専用のディレクトリ

- **`_` で始まるディレクトリは「公開しない」の印。** `src/components/_util/` は複数のコンポーネントが使うパーツと関数、`src/hooks/_internal/` は内部専用の hook。**`src/index.ts` から re-export しないこと、story を置かないこと**
- 公開しない hook は `hooks/_internal/` に置く。ただし、コンポーネントと context を共有する hook はそのコンポーネントと同じファイルに置く（`_util/Placement.tsx` の `useCheckPlacement`）
- テストは実装の隣ではなく `__tests__/util/` に置く。どれか 1 つのコンポーネントの挙動として書けないため
- **利用者も使う汎用な関数になったら `_util` ではなく `@tremolo-ui/functions` へ、DOM に依存するロジックは `@tremolo-ui/dom` へ移す**
- `compose-refs/` は内部用ではなく、サブパス `@tremolo-ui/react/compose-refs` で公開している。サブパスを増やすときは `tsdown.config.ts` の `entry` と `package.json` の `exports` を両方直す

## 命名

- **公開する型はコンポーネント名で始める。** `Root` の props は `<Component>Props`、パートの props は `<Component><Part>Props`。ref で公開するメソッドは `<Component>Methods` / `<Component><Part>Methods`。`src/index.ts` に全コンポーネントの型が並ぶので、`ThumbProps` のような名前は衝突する
- 公開する props の型には独自の props だけを書く。描く要素の属性はファイル内で `type Props = XProps & Omit<ComponentPropsWithoutRef<'div'>, keyof XProps>` と合わせる。ネイティブの属性を API ページや Controls に並べないため
- context は `<Component>ContextValue` を型にし、selector を受ける `use<Component>Context` と一緒に公開する。selector の引数の型として利用者が書くため
- `useCheckPlacement` と `<Placement name>` に渡す名前は、利用者が JSX に書く形（`'Slider.Thumb'`）にする。警告にそのまま出る

### stories

- パートの story は `<Part>.stories.tsx`、`Root` の story は `<Component>.stories.tsx`
- **title の最上位は `Components` / `Hooks` / `combined` の 3 つだけ**（`combined` だけ小文字）。`__stories__/lib/storyIndex.tsx` がこの名前でトップページの一覧を組むので、増やしたり綴りを変えたりすると一覧から落ちる
  - コンポーネント: `Components/<Component>/<Part>`。`Root` も `Root` と書く。compound でないもの（`AnimationCanvas`）だけ `Components/<Component>`
  - hook: `Hooks/<hookName>`
  - combined: `combined/<Name>`。複数ファイルにまたがる例は `combined/<Name>/<Name>` を入口にする
- 最初の story は `Basic` にする。ただし、描く要素の属性（`className` / `style` / `children`）しか受けないパートには置かず、主題の story だけでよい。素の形を見せても、Controls で触れるものが無いため
- テーマは `import sliderTheme from 'shared/css/Slider.module.css'` のように `<camelCase>Theme` の名前で読み、story 専用の CSS は `styles` の名前で読む

## stories とテストの置き場

- 1 つのコンポーネント / hook に対応する story とテストは、実装の隣に置く
- **どのコンポーネントの隣にも置けないものだけ** `__tests__/` / `__stories__/` に置く。複数のコンポーネントを一緒に render するもの、共有ユーティリティのテスト、ビルドツール自身のテスト、story の素材の 4 つ。**1 つのコンポーネントで代表させられる挙動をここに足さないこと**
- story とテストが `src/` の中に混ざるので、**`.ts` / `.tsx` 以外の種類のファイルを足すときは 2 箇所を個別に直す。** `package.json` の `files`（publish から除く）と、`.storybook/main.ts` の `stories`（**こちらは「拾う」側**で、書かなければ Storybook に出てこない）

## Storybook

### コンポーネントの story

- **meta は `satisfies Meta<...>` にし、`component` を必ず渡す。** react-docgen の props も、`.storybook/propTypes.ts` が解決した型も、component 自体をキーに引いているので、渡さないと Controls が空になる
- **story には `type Story = StoryObj<...>` で型を付け、`export const Basic: Story = { args, render }` の形で書く**
- 値は `render` の中の `useState` で持つ。`Root` の meta では `value` と `children` を `control: false` にする。`{...args}` はテーマの `className` の後、`value` / `onChange` の前に展開する（Controls からクラスは上書きでき、値は story が握る）
- **サブコンポーネントごとに story ファイルを分ける。** `Root` の story しか無いと、パートの props を Controls で触れない。args はそのパートに展開する
  - パートの挙動を決める props が `Root` にある場合（`NumberInput` の `Stepper` / `InputField`）は `StoryObj<typeof X.Root>` で型を付けて `Root` に展開する
- props ではないスイッチ（そのパートを描くかどうか）を Controls に出すときは、`Parts` 型を Args に交差させて `table: { category: 'Parts' }` を付ける。**meta ではなく使う story の `argTypes` に置き**、`render` の引数で分割代入して取り除いてから展開する
- 色を受ける props は `control: 'color'` にする
- **`table.type.summary` を手で書かない。** 型の表示は `.storybook/argTypes.ts` が埋める。story 側で書いた summary はそちらが優先されて、自動で埋まらなくなる
- story の JSDoc は docs ページの説明文になる。何を確かめるための story なのかを書く
- `__stories__/public` の静的ファイルは `import.meta.env.BASE_URL + 'file.png'` で参照する。本番ビルドはサブパスから配信する

### hooks の story

- **`src/index.ts` から公開している hook にだけ置く。** ただし全部には置かない。操作して挙動を確かめるもの（ドラッグ・長押し・MIDI など）に置き、ブラウザ API を薄く包むだけのもの（`useEventListener` / `useInterval` / `useAnimationFrame`）には置かない
- 描く component が無いので `Meta` / `StoryObj` は使わない。`export default { title }` と、関数の story（`export const Basic = () => ...`）で書く
- **story を開いただけで権限プロンプトや音が出ないようにする。** ユーザーの操作から始める（`useMIDIAccess(false)` にしてボタンで `request` する、など）

### combined

- 複数のコンポーネントを組み合わせたアプリに近いデモは `__stories__/combined/` に置く。meta に `tags: ['!autodocs']` を付けて docs ページを作らず、Controls も持たせない
- コンポーネントはパッケージ名ではなく、`../../src/components/<Name>` を相対パスで import する。パッケージ名だと `dist` を読むので、ビルドするまで変更が反映されない
- 複数ファイルにまたがる例はディレクトリにまとめ、各セクションを story として export して、入口の story から import してよい
- story だけで使う部品は `__stories__/lib/`、story 専用の CSS は `__stories__/styles/` に置く。`shared/css/` はドキュメントに全文を載せる配布用のテーマなので、デモの都合を入れない
- story だけで使うライブラリ（`tone` / `jotai`）は `devDependencies` に入れる

## 開発時の警告

- **開発時の警告は本番バンドルに残さない。** 分岐の条件は `process.env.NODE_ENV` を先頭にインラインで書く。ヘルパーや定数を経由すると畳み込まれず、メッセージの文字列ごとバンドルに残る（esbuild で実測済み。`_util/Placement.tsx` のコメント）
- 配置に依存するサブコンポーネントは `useCheckPlacement` を呼び、子の配置を決めるパートは children を `<Placement>` で包む。値を持つコントロールは `useCheckSteps` を呼ぶ。どちらも、置き間違いや動かない step が黙って壊れる問題をこれで拾っている
