# codex レビュー: @tremolo-ui/react（テスト）

- 実行日時: 2026-09-08 22:25 (JST)
- 対象: `packages/react/src/**/*.test.tsx と packages/react/__tests__/`
- コミット: `8cc8371`
- 実行: `codex exec --sandbox read-only`（codex-cli 0.153.4）
- 最終確認: 2026-09-10 (`a93d98f`)

---

## 対応状況

| 状況 | 件数 |
| --- | --- |
| 対応済み | 13 |
| 一部対応 | 0 |
| 対応する（未対応） | 0 |
| 要判断 | 0 |
| 対応しない | 0 |
| 未判断 | 0 |

全 P1 / P2 / P3 を判定済み。P1 は再現の有無まで確認した。

---

### [P1] ドラッグ中のアンマウントでページ全体の `user-select` が復元されない — packages/react/__tests__/drag.test.tsx:51

> **状況: 対応済み** — #207 でアンマウント、`readonly` 化、XYPad、PointsEditor、2回目のドラッグを検証し、どの終了経路でもページ全体の選択抑止が復元されることを固定した。

**何が問題か**

テストの `drag` helper は `pointerdown` / `pointermove` だけを送り、`pointerup` を送りません。

```tsx
act(() => {
  root.dispatchEvent(pointerEvent('pointerdown', points[0]))
})
for (const point of points.slice(1)) {
  act(() => {
    root.dispatchEvent(pointerEvent('pointermove', point))
  })
}
```

一方、Slider はドラッグ開始時にページ全体へ `user-select: none` を設定し、通常の終了時にしか解除しません。

```tsx
// packages/react/src/components/Slider/index.tsx:244
onDragStart: (v) => {
  if (readonly) return
  if (externalStyles.userSelectNone) addUserSelectNone()
  // ...
},
onDragEnd: (v) => {
  if (readonly) return
  if (externalStyles.userSelectNone) removeUserSelectNone()
  // ...
},
```

アンマウント時の `useDragValue` は DOM instance を破棄するだけです。

```tsx
// packages/react/src/hooks/useDragValue.ts:165
return () => {
  instanceRef.current = null
  instance.destroy()
}
```

`createDrag.destroy()` は追跡を止めますが `onDragEnd` を呼びません（`packages/dom/src/pointer/drag.ts:411`）。同じ取得・解放パターンは XYPad、PointsEditor.Point、PointsEditor.Container にもあります。

**どう壊れるか**

ドラッグ中にルート変更、条件付きレンダー、モーダルのクローズなどでコンポーネントをアンマウントすると、`body.style.userSelect` が `none` のまま残ります。内部カウンターも残るため、その後の正常なドラッグを一度完了させても復元されません。

また、ドラッグ開始後に `readonly={true}` へ変更した場合も、最新の `onDragEnd` が `if (readonly) return` で解除を飛ばします。

現在のテスト自身も未完了ドラッグのまま cleanup されますが、body の状態を検証していないためこの不具合を見逃します。

**対応案**

取得済みかを ref で記録し、現在の `readonly` に関係なく一度だけ解除する cleanup を実装してください。各コンポーネントについて、次を追加します。

- `pointerdown` 後にアンマウントし、body の元のスタイルが復元されること
- ドラッグ中に `readonly` を `false` から `true` に変えてから `pointerup` しても復元されること
- 通常のテスト helper も原則として最後に `pointerup` を送ること

### [P1] テストが禁止されている既定描画フォールバックを前提化している — packages/react/src/components/XYPad/index.test.tsx:104

> **状況: 対応済み** — #204 で `Slider.Thumb` / `XYPad.Thumb` を 1 要素にし、既定描画のフォールバックそのものを無くした。契約テストは `Slider/Thumb.test.tsx` に追加（XYPad は同一構造のため代表させている）。

**何が問題か**

テストは既定 Thumb が生成されることを明示的に前提としています。

```tsx
/**
 * The focusable element is the default thumb the wrapper renders, not the
 * wrapper itself, so a test that focuses has to reach past the test id.
 */
const thumbElement = () =>
  document.querySelector<HTMLElement>('.tremolo-xy-pad-thumb')!
```

実装にもフォールバックがあります。

```tsx
// packages/react/src/components/XYPad/Thumb.tsx:76
{children ? (
  children
) : (
  // default thumb
  <div className={cx('tremolo-xy-pad-thumb', className)} ... />
)}
```

同じ構造が `Slider/Thumb.tsx:67` にあり、NumberInput の stepper も次のフォールバックを持ちます。

```tsx
// packages/react/src/components/NumberInput/stepperButton.tsx:70
{children ?? icon}
```

ほぼすべての fixture が `<Slider.Thumb />`、`<XYPad.Thumb />`、`<NumberInput.IncrementStepper />` のような空のサブコンポーネントを使っています。

**どう壊れるか**

リポジトリ前提どおり「children をそのまま描画し、既定描画を持たない」実装へ直すと、現在のテストは大量に失敗します。逆に、現状の契約違反はすべて green のままです。

さらに `children={0}` や空文字は truthy 判定で既定 Thumb に置換されます。カスタム child を渡す経路では内部 `elementRef` が接続されないため、Root の `focus()` やドラッグ後のフォーカス移動も現在のテストでは保証されません。

**対応案**

fixture に明示的な child を与え、次の契約テストを追加してください。

- child が同一の内容・順序で描画される
- `null` / `undefined` で既定 DOM が追加されない
- `0` や空文字を勝手に置換しない
- カスタム child 使用時のフォーカス責務を、公開 API の設計に沿って検証する

### [P2] `readonly` の Knob がダブルクリックで値を変更できる — packages/react/src/components/Knob/index.tsx:321

> **状況: 対応済み** — #210 で `readonly` の Knob に対するダブルクリックが `onChange` を呼ばず、フォーカス可能性は保つことを回帰テストで固定した。

**何が問題か**

キーボード、ホイール、ドラッグには `readonly` guard がありますが、ダブルクリックの既定値復元にはありません。

```tsx
onDoubleClick={(event) => {
  if (enableDoubleClickDefault && onChange) {
    onChange(defaultValue)
  }
  onDoubleClick?.(event)
}}
```

Knob のテストはサイズ、ドラッグ、Shift キー操作だけで、`defaultValue`、`enableDoubleClickDefault`、`readonly` とダブルクリックの組み合わせを検証していません。

**どう壊れるか**

例えば `value={20} defaultValue={50} readonly` の Knob をダブルクリックすると `onChange(50)` が呼ばれます。`aria-readonly="true"` と実際の動作が矛盾します。

**対応案**

`readonly` を既定リセットの条件に加え、少なくとも次の組み合わせをテストしてください。

- 通常時は `defaultValue` に戻る
- `readonly` では戻らない
- `enableDoubleClickDefault={false}` では戻らない
- 上記の場合も利用者の `onDoubleClick` は呼ばれる

### [P2] `Knob.Thumb` の `className` が捨てられているがテストされていない — packages/react/src/components/Knob/Thumb.tsx:28

> **状況: 対応済み** — `Knob.Thumb` の SVG に利用者の `className` を結合し、`data-*` とイベント handler を含むホスト props の転送をテストした。

**何が問題か**

`className` を destructure した後、描画では使用していません。

```tsx
export function Thumb({
  className,
  // ...
  classes,
  ...props
}: Props & Omit<SVGProps<SVGSVGElement>, 'd' | keyof Props>) {
  // ...
  return (
    <svg className={cx('tremolo-knob-thumb', classes?.thumb)} {...props}>
```

既存の Knob テストはすべて `<Knob.Thumb />` で、ホスト属性の転送を確認していません。

**どう壊れるか**

`<Knob.Thumb className="custom-thumb" />` としても、出力 SVG に `custom-thumb` が付きません。CSS Modules、Tailwind、利用者独自セレクターなどによる装飾が効きません。

**対応案**

`cx('tremolo-knob-thumb', classes?.thumb, className)` のように反映し、`className`、`data-*`、イベント handler など代表的な SVG props の転送テストを追加してください。

### [P2] Piano の `fill` 分岐と白鍵ゼロの境界値が未テスト — packages/react/src/components/Piano/index.tsx:176

> **状況: 対応済み** — fake `ResizeObserver` で親幅、`keyGap` の変更、unmount 時の切断を検証した。白鍵がない範囲でも分母を 1 以上にして有限の幅を返すようにした。

**何が問題か**

`fill` 時の幅は白鍵数で割って計算されます。

```tsx
const whiteKeyCount = useMemo(
  () => notes.filter(isWhiteKey).length,
  [notes],
)

// ...

const resizeObserver = new ResizeObserver(() => {
  setFilledKeyWidth(node.clientWidth / whiteKeyCount - keyGap)
})
```

`NoteRange` は単なる `{ first: number; last: number }` で、白鍵を最低一つ含む制約はありません。Piano のテストには `fill` または `ResizeObserver` を使うケースがありません。

**どう壊れるか**

`noteRange={{ first: CSharp, last: CSharp }}` のように黒鍵一つだけを `fill` 描画すると `whiteKeyCount` は `0` になり、幅が `Infinity` になります。通常範囲でも、親のリサイズ反映や observer の disconnect が壊れてもテストは通ります。

**対応案**

ResizeObserver を制御できる fake を用意し、以下を検証してください。

- 親幅と白鍵数から幅が更新される
- `keyGap` の変更が反映される
- アンマウントで observer が切断される
- 白鍵ゼロを拒否するか、有限値へフォールバックするという明示的な仕様

### [P2] Storybook の namespace component 収集経路が fixture から抜けている — packages/react/__tests__/storybook/propTypes.test.ts:7

> **状況: 対応済み** — fixture に直接 export と namespace object の両方を追加し、member の収集と直接 export との重複排除を検証した。

**何が問題か**

実装には namespace オブジェクトの member を探索する専用分岐があります。

```ts
// packages/react/.storybook/propTypes.ts:155
for (const exported of exports) {
  // ...
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) continue

  for (const member of initializer.properties) {
    if (!ts.isShorthandPropertyAssignment(member)) continue
    // ...
    collected.push({
      module: file,
      exportName: exported.name,
      member: member.name.text,
      props,
    })
  }
}
```

しかし fixture は単独関数だけです。

```tsx
export function Fixture({ children }: FixtureProps) {
  return <>{children}</>
}
```

テストも `[m0.Fixture, {` しか確認していません。

**どう壊れるか**

`Slider.Root` や `NumberInput.InputField` の探索、`member` の記録、直接 export との重複排除が壊れてもテストはすべて通ります。実際の Storybook では namespace component の型詳細だけが消えます。

**対応案**

fixture に `Root` とサブコンポーネントを持つ namespace オブジェクトを追加し、収集結果の `exportName` / `member` と、生成コードの `[m0.Namespace.Root, ...]` を検証してください。同じ関数が直接 export されている場合に一度だけ出力されることも必要です。

### [P2] React 19 callback-ref cleanup の専用分岐が未テスト — packages/react/__tests__/util/composeRefs.test.tsx:51

> **状況: 対応済み** — callback ref が返す React 19 cleanup の呼び出しと、object ref が unmount 時に `null` へ戻ることを専用テストで固定した。

**何が問題か**

実装は callback ref が cleanup 関数を返す React 19 の経路を明示的に扱っています。

```tsx
// packages/react/src/components/_util/composeRefs.tsx:26
const cleanups = refs.map((ref) => {
  const cleanup = setRef(ref, node)
  // ...
  return cleanup
})

if (hasCleanup) {
  return () => {
    // cleanup() または setRef(ref, null)
  }
}
```

ところがテストの callback は常に `void` を返します。また「sets both an object ref and a callback ref」というテストも、外から確認しているのは callback が書き込んだ `seen` だけです。

```tsx
let seen: HTMLDivElement | null = null
const { getByTestId } = render(<Subject onAttach={(n) => (seen = n)} />)
expect(seen).toBe(getByTestId('target'))
```

内部の `objectRef.current` は一度も assertion されません。

**どう壊れるか**

cleanup 関数が呼ばれない、cleanup 対象へ誤って `null` callback も送る、同時に合成した object ref が null に戻らない、といった React 19 固有の回帰を捕捉できません。observer や購読解除を ref cleanup に置く利用者ではリソースリークになります。

**対応案**

callback ref が disposer を返す Host を作り、アンマウント時に disposer が一度だけ呼ばれること、callback に `null` が送られないこと、併設した object ref が `null` へ戻ることをそれぞれ検証してください。

### [P2] NumberInput の「長押しで繰り返す」契約が一度も検証されていない — packages/react/src/components/NumberInput/stepperButton.tsx:42

> **状況: 対応済み** — #209 の hook 単体テストに加え、NumberInput の Stepper を長押ししたときの即時更新、待機後の反復、解放後の停止と次回長押しの待機時間リセットを結合テストで固定した。

**何が問題か**

長押しは即時実行、初期待機、繰り返し間隔、pointerup による停止という複数経路を持ちます。

```tsx
const press = useLongPress(() => {
  if (stepper?.draggingRef.current) return
  nudge(direction, ['raw', step])
})
```

```tsx
// packages/react/src/hooks/useLongPress.ts:14
useInterval(
  () => {
    callback()
    setDelay(interval)
  },
  pressed ? delay : null,
)

useEventListener(globalThis.window, 'pointerup', () => {
  setPressed(false)
  setDelay(initialDelay)
})
```

既存テストは `pointerdown` 直後の一回だけを確認しています。

```tsx
fireEvent.pointerDown(screen.getByRole('button', { name: 'Increment' }))
expect(input().value).toBe('11Hz')
```

**どう壊れるか**

500 ms 後に繰り返しが始まらない、40 ms 間隔へ切り替わらない、pointerup 後も値が変わり続ける、といった回帰がすべて通過します。

**対応案**

fake timer を使い、即時一回、499 ms では追加なし、500 ms で一回、以後 40 ms ごと、window の `pointerup` 後は停止、再度押したときは初期待機へ戻ることを検証してください。

### [P2] MIDI の React bridge 二つにテストがない — packages/react/src/hooks/useMIDIAccess.ts:23

> **状況: 対応済み** — #209 の StrictMode テストに加え、`requestOnMount={false}`、inputs / error の更新、`useMIDIMessage` の最新 handler、access 交換、unmount cleanup を検証した。

**何が問題か**

`useMIDIAccess` には mount 時 request の条件と store 購読、destroy があります。

```tsx
const { midiAccess, error, inputs } = useSyncExternalStore(
  instance.subscribe,
  instance.getState,
  instance.getServerState,
)

useEffect(() => {
  if (requestOnMount) instance.request()
}, [instance, requestOnMount])

useEffect(() => {
  return () => instance.destroy()
}, [instance])
```

`useMIDIMessage.ts:19` にも `midiAccess` 交換時の再生成、最新 handler への差し替え、destroy があります。一方、React 側に存在する MIDI テストは `useMIDIInput.test.tsx` のみです。

**どう壊れるか**

以下の React 固有の接続不良を `@tremolo-ui/dom` 側のテストだけでは検出できません。

- `requestOnMount={false}` でも権限ダイアログが開く
- store 更新後も React の `inputs` / `error` が再描画されない
- アンマウントで instance が破棄されない
- `useMIDIMessage` の props 更新後も古い handler が呼ばれる
- `midiAccess` を交換したとき古いデバイスに listener が残る

**対応案**

DOM 内部の MIDI デコードを再テストせず、fake instance で React bridge の責務だけを固定してください。`request` 回数、subscribe 通知後の表示、handler の更新、access 交換、unmount 時 destroy を検証します。

### [P2] AnimationCanvas の relative sizing 切替経路が未テスト — packages/react/src/components/AnimationCanvas/index.tsx:112

> **状況: 対応済み** — `relativeSize` の切り替えで instance を再構築し、通常の props 更新では再利用することを検証した。テストで見つかった再構築時に前 render のサイズを使う問題も修正した。

**何が問題か**

`relativeSize` は instance を作り直す唯一の prop です。

```tsx
const instance = createAnimationCanvas(node, {
  // ...
  relativeSize,
  contextAttributes: current.options,
})

// Only `relativeSize` decides how the instance is wired
}, [node, relativeSize])
```

既存テストは絶対サイズ、`animate`、`options`、アンマウントだけで、`relativeSize` と `reduceFlickering` を渡していません。

**どう壊れるか**

`relativeSize` を `false` から `true` に変えても observer が付かない、旧 instance が残って animation loop が二重になる、親サイズが初期描画へ届かない、といった React 側の再構築不良が通過します。DOM パッケージの relative-size テストは、React effect の依存関係までは保証しません。

**対応案**

ResizeObserver の fake を使い、絶対→相対および相対→絶対の rerender、旧 observer/loop の破棄、親サイズ反映、`reduceFlickering` 更新を検証してください。

### [P3] 実在しない `KeyboardEvent.key === ''` で黒鍵ショートカットを検証している — packages/react/src/components/Piano/index.test.tsx:153

> **状況: 対応済み** — HOME_ROW_NATURAL の黒鍵ショートカットを実在する `KeyboardEvent.key === 'w'` で検証するようにした。

**何が問題か**

テスト自身が「実際の KeyboardEvent.key にはならない」と書いた値を送っています。

```tsx
// The entries the black keys would use are empty strings, which no
// KeyboardEvent.key can be.
onPlayNote.mockClear()
act(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '' }))
})
expect(onPlayNote).not.toHaveBeenCalled()
```

実装は配列を検索する前にこの入力を専用 guard で捨てます。

```tsx
// packages/react/src/components/Piano/index.tsx:254
if (!keyboardShortcuts || key === '') return null
```

**どう壊れるか**

この assertion は空スロットの実用上の契約ではなく、到達不能な guard だけを検証します。例えば `HOME_ROW_NATURAL` に誤って `'w'` が入り C# が鳴る回帰は、このテストが通ったままです。

**対応案**

実在する未割り当てキー、例えば `'w'` を送って発音しないことを確認してください。併せて `'s'` が D を鳴らす現在の assertion は残すと、空スロットによって後続キーの位置がずれないことも保証できます。

### [P3] XYPad の垂直ホイール操作が二重に検証されている — packages/react/__tests__/modifiers.test.tsx:200

> **状況: 対応済み** — 基本的な垂直wheelケースはXYPad固有テストだけに残し、横断テストはShiftによる軸選択と`deltaX`による横方向ジェスチャーに限定した。

**何が問題か**

横方向や Shift の `deltaX` ケースには追加価値がありますが、次のテストは、

```tsx
fire(container, { deltaX: 0, deltaY: 1 })
expect(onChange).toHaveBeenLastCalledWith([5, 6])
```

`packages/react/src/components/XYPad/index.test.tsx:197` の次の検証と実質的に同じです。

```tsx
wheel(root, { deltaY: -1 })
expect(onChange).toHaveBeenLastCalledWith([50, 49])
```

どちらも既定スケールで、フォーカス中の垂直 wheel が y 軸を一ステップ動かすことを確認しています。

**どう壊れるか**

同じ仕様変更で二箇所の修正が必要になり、差がないまま fixture と helper が重複します。重複自体は偽陽性を生みませんが、重要な未テスト分岐に対する保守コストを増やします。

**対応案**

基本的な垂直 wheel はコンポーネント固有テストへ集約し、`modifiers.test.tsx` には `deltaX` の正負、Shift による軸選択など、複数コンポーネントを横断する配線だけを残してください。

### [P3] `useDragValue` の必須 mapping エラー経路が未テスト — packages/react/src/hooks/useDragValue.ts:104

> **状況: 対応済み** — `linear` / `rotary` のどちらも指定しない場合に、契約どおり例外を投げることをテストした。

**何が問題か**

公開 hook は `baseElementRef` と `getValue` の両方がない場合に明示的なエラーを投げます。

```tsx
if (!baseElementRef && !options.getValue) {
  throw new Error(
    'useDragValue: give either baseElementRef or getValue, so that the drag has something to move',
  )
}
```

既存の四テストは Absolute fixture で必ず `baseElementRef`、Relative fixture で必ず `getValue` を渡しており、この分岐に到達しません。

**どう壊れるか**

guard が削除されたり、判定が `&&` から誤って `||` になったり、診断メッセージが失われてもテストは通ります。利用者には初回 pointer 操作時の不明瞭な失敗として現れます。

**対応案**

`axis` だけを渡す最小 Host の render が所定のメッセージで throw することを追加してください。併せて、各有効形態が throw しないことを一ケースずつ残すと条件式の反転も検出できます。

## まとめ

- P1: 2 件
- P2: 8 件
- P3: 3 件

優先して直すべき上位 3 件は次のとおりです。

1. ドラッグ中のアンマウント／`readonly` 変更による body の `user-select` 永続化
2. 既定 Thumb・stepper icon を前提にしたテストを、children 透過というリポジトリ契約へ合わせること
3. `readonly` Knob のダブルクリックが値を変更する経路

指定に従い、テスト・ビルドは実行していません。上記は対象ファイルと関連実装を読み合わせた静的レビュー結果です。
