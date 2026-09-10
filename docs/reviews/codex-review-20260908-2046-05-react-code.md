# codex レビュー: @tremolo-ui/react（コード）

- 実行日時: 2026-09-08 22:10 (JST)
- 対象: `packages/react/src/（テスト・story を除く）`
- コミット: `8cc8371`
- 実行: `codex exec --sandbox read-only`（codex-cli 0.153.4）
- 最終確認: 2026-09-10 (`a93d98f`)

---

## 対応状況

| 状況 | 件数 |
| --- | --- |
| 対応済み | 13 |
| 対応する（未対応） | 7 |
| 要判断 | 0 |
| 対応しない | 0 |
| 未判断 | 0 |

全 P1 / P2 / P3 を判定済み。P1 は再現の有無まで確認した。

---

### [P1] `useMIDIAccess` が Strict Mode の effect 再実行後に停止する — packages/react/src/hooks/useMIDIAccess.ts:23

> **状況: 対応済み** — #209 で effect の setup ごとに MIDI access instance を作り、世代ごとに cleanup する store へ変更した。StrictMode での取得と unmount 時の破棄を回帰テストで確認済み。

**何が問題か**

インスタンスを render 時に一度だけ生成し、effect cleanup で不可逆に破棄しています。

```ts
const instance = useMemo(() => createMIDIAccess(), [])

useEffect(() => {
  if (requestOnMount) instance.request()
}, [instance, requestOnMount])

useEffect(() => {
  return () => instance.destroy()
}, [instance])
```

`createMIDIAccess().destroy()` は内部の `destroyed` フラグを立て、以後の `request()` を無視します。

**どう壊れるか**

React Strict Mode の開発環境では effect が `setup → cleanup → setup` と再実行されます。最初の cleanup で同じ `instance` が破棄され、2回目の `request()` は何もしません。結果として MIDI access が取得されず、以後手動で `request()` を呼んでも復旧しません。

**対応案**

effect の各ライフサイクルで再生成できる構造にするか、`destroy()` と再接続可能な `activate()` / `deactivate()` を分けてください。少なくとも、一度破棄したインスタンスを Strict Mode の再 setup で再利用してはいけません。

### [P1] ドラッグ中の破棄や `readonly` 変更で body の `user-select: none` が残る — packages/react/src/components/Slider/index.tsx:244

> **状況: 対応済み** — #207 でドラッグの全終了経路から `onDragEnd` を必ず一度通知し、早期 return より前に選択抑止を解除するようにした。#212 で選択抑止は DOM 層へ一本化済み。

**何が問題か**

ドラッグ開始時にグローバルスタイルを取得しますが、解除は正常な `onDragEnd` にしかありません。さらに `readonly` 判定が解除より先です。

```ts
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

一方、hook の cleanup は `destroy()` するだけです。

```ts
return () => {
  instanceRef.current = null
  instance.destroy()
}
```

確認した `@tremolo-ui/dom` の `destroy()` は追跡とリスナを破棄しますが、`onDragEnd` は呼びません。同じ取得・解除方式は XYPad、PointsEditor.Point、PointsEditor.Container、Knob にあります。

**どう壊れるか**

次のいずれかで解除が行われません。

- ドラッグ中にコンポーネントをアンマウントする
- Slider / XYPad / Point で、ドラッグ中に `readonly` を `true` にする
- PointsEditor でドラッグ中に `selectable` を `false` にする

`_util/index.ts` のカウンタが正数のまま残るため、その後のドラッグが正常終了しても body のテキスト選択が復元されません。

**対応案**

取得済みかを ref で管理し、正常終了だけでなく effect cleanup でも必ず解除してください。`readonly` などの早期 return より前に内部 cleanup を実行する必要があります。hook 側にも「キャンセル時の cleanup」を表す経路を用意すると安全です。

### [P1] Piano のキー割り当て変更で発音中ノートが停止されない — packages/react/src/components/Piano/index.tsx:253

> **状況: 対応済み** — #208 で keydown 時のキーとノートの対応を記録し、割り当て変更、focusout、window blur、unmount で発音中のノートを解放するようにした。

**何が問題か**

`keyup` 時に、`keydown` 時のノートではなく現在の props からノートを再計算しています。

```ts
function shortcutNote(key: string) {
  if (!keyboardShortcuts || key === '') return null
  const index = keyboardShortcuts.keys.indexOf(key)
  return index === -1 ? null : noteRange.first + index
}

useEventListener(globalThis.window, 'keydown', (e) => {
  // ...
  const note = shortcutNote(e.key)
  if (note !== null)
    instanceRef.current?.noteOn(note, { source: 'keyboard' })
})

useEventListener(globalThis.window, 'keyup', (e) => {
  const note = shortcutNote(e.key)
  if (note !== null)
    instanceRef.current?.noteOff(note, { source: 'keyboard' })
})
```

**どう壊れるか**

`noteRange.first=60` で `a` を押し、押したまま `noteRange.first=72` に変更すると、keydown は 60 を開始しますが keyup は 72 を停止します。60 は発音中のまま残ります。`keyboardShortcuts` を削除・変更した場合も同様です。ウィンドウがフォーカスを失い keyup を受け取れない場合にも停止経路がありません。

**対応案**

keydown 時に `Map<key, note>` へ実際に開始したノートを記録し、keyup はその記録を停止してください。`blur`、割り当て解除、コンポーネント cleanup でも記録中の全ノートを停止する必要があります。

### [P1] `useLongPress` が `pointercancel` 後も値を変更し続ける — packages/react/src/hooks/useLongPress.ts:14

> **状況: 対応済み** — #209 で `pointercancel` と window blur で反復を止め、active pointer 以外の終了イベントを無視するようにした。fake timer による回帰テストも追加済み。

**何が問題か**

反復を止めるイベントが `pointerup` しかありません。

```ts
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

**どう壊れるか**

タッチ操作が OS やブラウザにキャンセルされた場合、`pointercancel` の後に `pointerup` は保証されません。NumberInput のステッパーは、500ms 後から40ms間隔で値を変更し続けます。ウィンドウのフォーカス喪失でも同様の状態になり得ます。

**対応案**

`pointercancel` と `window.blur` でも停止してください。可能なら開始した `pointerId` と主ボタンを記録し、対応するポインタだけで開始・終了する設計にします。

### [P2] `disabled` と宣言したコントロールが操作可能なまま — packages/react/src/components/Knob/index.tsx:225

> **状況: 対応済み** — #210 で `disabled || readonly` を入力ガードとし、Knob を含む5コンポーネントのキーボード、ドラッグ、ホイール、ダブルクリックを停止した。`disabled` は tab 順からも除外済み。

**何が問題か**

入力処理は `readonly` しか確認していませんが、DOM には `aria-disabled` を設定しています。

```ts
if (!keyboard || !onChange || readonly) return
```

```tsx
aria-disabled={disabled}
aria-readonly={readonly}
```

Slider、XYPad、NumberInput、PointsEditor にも同じ設計があります。

**どう壊れるか**

`disabled={true}` の Knob にフォーカスして矢印キーを押すと `onChange` が呼ばれます。ポインタやホイールでも変更できます。一方、支援技術には「利用不能」と通知されるため、視覚・ARIA・実際の挙動が矛盾します。

**対応案**

通常の `disabled` として、キーボード・ポインタ・ホイール・ダブルクリックをすべて停止してください。外観だけの状態が必要なら別名の prop / `data-*` に分け、`aria-disabled` は付けないでください。

### [P2] `readonly` の Knob がダブルクリックで変更される — packages/react/src/components/Knob/index.tsx:321

> **状況: 対応済み** — #210 でダブルクリックの既定値復元も `disabled || readonly` で停止し、回帰テストを追加した。

**何が問題か**

ダブルクリックの既定値復元だけは `readonly` を確認していません。

```tsx
onDoubleClick={(event) => {
  if (enableDoubleClickDefault && onChange) {
    onChange(defaultValue)
  }
  onDoubleClick?.(event)
}}
```

**どう壊れるか**

`readonly value={50} defaultValue={0}` の Knob をダブルクリックすると `onChange(0)` が呼ばれます。キーボード・ドラッグ・ホイールは停止するため、この経路だけ契約から外れています。

**対応案**

既定値への変更条件へ `!readonly` を追加してください。`disabled` を実際の無効状態に直す場合は、そちらも同時に確認します。

### [P2] `clampValue={false}` や未指定範囲でも安全整数へクランプされる — packages/react/src/components/NumberInput/index.tsx:226

> **状況: 対応済み** — commit 時は `clampValue` と実際に指定された `min` / `max` だけを使い、`applyDelta` 用の内部範囲から分離した。raw 操作にも全有限値を覆う別の範囲を使い、安全整数を超える値、片側だけの範囲、Stepper drag を回帰テストに追加した。

**何が問題か**

無制限範囲を `Number.MIN_SAFE_INTEGER` / `MAX_SAFE_INTEGER` で代用し、commit 時には常にその範囲でクランプしています。

```ts
const range: ValueRange = useMemo(
  () => ({
    min: (clampValue ? min : undefined) ?? Number.MIN_SAFE_INTEGER,
    max: (clampValue ? max : undefined) ?? Number.MAX_SAFE_INTEGER,
    step,
    scale,
  }),
  // ...
)
```

```ts
changeValue(clamp(parsed, range.min, range.max))
```

**どう壊れるか**

`clampValue={false}` で `1e20` を入力して確定すると、`9007199254740991` に変更されます。`min` / `max` を一切指定していない場合も同じです。JavaScript の有限値として表現可能であり、公開ドキュメント上はクランプしない入力です。

**対応案**

入力の commit は `clampValue` と実際の `min` / `max` だけで判定してください。`applyDelta` 用の有限な内部範囲が必要なら、入力確定用の範囲と分離します。

### [P2] 横向き Slider の `reverse` がホイール方向へ反映されない — packages/react/src/components/Slider/index.tsx:260

> **状況: 対応済み** — 物理ホイール方向の決定後に orientation にかかわらず `reverse` を適用し、横・縦と `deltaX` / `deltaY` の方向を回帰テストに追加した。

**何が問題か**

ホイール方向を反転する条件が `vertical && reverse` に限定されています。

```ts
if (!vertical && event.deltaX !== 0) {
  direction = event.deltaX > 0 ? 1 : -1
} else {
  if (event.deltaY === 0) return
  direction = event.deltaY > 0 ? -1 : 1
}
if (vertical && reverse) direction *= -1
```

キーボード側は向きに関係なく `reverse` を適用しています。

**どう壊れるか**

横向き Slider で `reverse={true}` にしても、ホイールおよび横スクロールの値変化は通常方向のままです。見た目と矢印キーは反転するため、同じ操作対象で入力方式ごとに方向が食い違います。

**対応案**

物理的なホイール方向を決定した後、orientation に関係なく `reverse` を一度適用してください。

### [P2] Slider の `role="slider"` と実際のフォーカス位置が分離している — packages/react/src/components/Slider/index.tsx:321

> **状況: 対応済み** — Thumb 内に視覚的に隠した `<input type="range">` を描画し、フォーカス、値、範囲、向き、状態、アクセシブルネームを同じ要素へ集約した。Root は将来の複数 Thumb に備えた group とし、各 input の ARIA 属性は対応する Thumb に直接指定する。支援技術からの change も `onChange` へ通知する。

**何が問題か**

ARIA 値を持つ Root はフォーカス不能で、フォーカスされる Thumb は role と値を持たない通常の `div` です。

```tsx
<div
  tabIndex={-1}
  role="slider"
  aria-valuenow={value}
  aria-valuemin={min}
  aria-valuemax={max}
>
```

```tsx
<div
  ref={elementRef}
  className={cx('tremolo-slider-thumb', className)}
  tabIndex={0}
  aria-disabled={disabled}
  aria-readonly={readonly}
/>
```

**どう壊れるか**

Tab で到達した支援技術のカーソルは Thumb 上にあり、Slider の現在値・範囲・orientation を読み上げません。ARIA 属性は祖先から継承されません。

さらに `Thumb` に `children` を渡すと `elementRef` 自体が描画されないため、`SliderMethods.focus()` とドラッグ開始時の focus が no-op になります。

**対応案**

ARIA slider と `tabIndex` を同じ DOM 要素に置いてください。構成可能性を保つなら、常に存在する Thumb wrapper をフォーカス対象にし、その中で `children` をそのまま描画する方法が扱いやすいです。

### [P2] XYPad と Point のキーボード操作がアクセシビリティツリーに表現されない — packages/react/src/components/XYPad/Thumb.tsx:76

> **状況: 対応済み** — XYPad.Thumb と PointsEditor.Point の内部へ、x / y 軸ごとに視覚的に隠した `<input type="range">` を配置した。XYPad.Root は2軸をまとめる group とし、各inputが値、範囲、向き、状態、名前を持つ。支援技術からの値変更も既存の `onChange` と選択移動へ接続している。

**何が問題か**

XYPad の既定 Thumb はフォーカス可能ですが、role、現在値、範囲、操作説明がありません。

```tsx
<div
  ref={elementRef}
  className={cx('tremolo-xy-pad-thumb', className)}
  tabIndex={0}
  aria-disabled={disabled}
  aria-readonly={readonly}
/>
```

PointsEditor.Point も role のない `div` を `tabIndex={0}` にしています。

```tsx
<div
  tabIndex={0}
  aria-disabled={disabled}
  aria-readonly={readonly}
  // ...
/>
```

**どう壊れるか**

キーボードでは矢印操作できても、スクリーンリーダーには「何を操作しているか」「x/y が何か」「現在値はいくつか」が通知されません。`aria-readonly` も、意味のある widget role がない要素では有効な状態表現になりません。

**対応案**

2軸値を表現するアクセシブルな構造を定義してください。例えば x/y の2つの slider semantics を提供し、視覚 Thumb と同期させます。Point にも名前と両軸の値を公開できる API が必要です。

### [P2] Piano のショートカットがページ全体を奪い、表示範囲外のノートも鳴らす — packages/react/src/components/Piano/index.tsx:253

> **状況: 対応済み** — #208 で `keyboardShortcutsScope` を追加し、既定をフォーカス配下の `root` にした。`noteRange.last` より外側とテキスト入力中のイベントも無視する。

**何が問題か**

ショートカットは常に `window` へ登録され、イベント対象や `noteRange.last` を確認しません。

```ts
const index = keyboardShortcuts.keys.indexOf(key)
return index === -1 ? null : noteRange.first + index
```

```ts
useEventListener(globalThis.window, 'keydown', (e) => {
  if (e.repeat) return
  const note = shortcutNote(e.key)
  // ...
})
```

描画される各キーも通常の `div` です。

```tsx
<div
  data-note={note}
  data-active={state.active}
  aria-disabled={state.disabled}
>
```

**どう壊れるか**

- テキスト入力中に `a` などを打っても Piano が発音する
- Piano が2台あると両方が発音する
- 1鍵だけの `noteRange` に `SHORTCUTS.HOME_ROW` を渡すと、`w` 以降で表示されていないノートが発音する
- 個々の鍵はフォーカス・role・accessible name を持たず、支援技術から直接演奏できない

**対応案**

ショートカットをフォーカスされた Piano にスコープし、editable 要素由来のイベントを無視してください。算出したノートは `noteRange.last` でも検証します。キーには button 相当の semantics、名前、キーボード操作を用意してください。

### [P2] React 18 ではサブコンポーネントの `ref` API が機能しない — packages/react/src/components/NumberInput/InputField.tsx:60

> **状況: 対応済み** — NumberInput.InputField / Stepper、PointsEditor.Container、Slider.Track / Thumb、XYPad.Area / Thumb を `forwardRef` に戻した。各exportがforward-ref componentであることも横断テストで固定した。

**何が問題か**

React 19 の「ref as a prop」に依存した通常の関数コンポーネントです。

```ts
export interface NumberInputFieldProps {
  // ...
  ref?: Ref<HTMLInputElement>
}

export function InputField({
  // ...
  ref,
}: NumberInputFieldProps & /* ... */) {
```

同じ形式が NumberInput.Stepper、PointsEditor.Container、Slider.Track / Thumb、XYPad.Area / Thumb にあります。一方、このパッケージは React 18 も peer dependency として公開しています。

**どう壊れるか**

React 18 で `<NumberInput.InputField ref={inputRef} />` としても `ref` は通常 props に渡らず、警告が出て `inputRef.current` は設定されません。他の列挙したサブコンポーネントも同様です。

**対応案**

React 18 をサポートする間は `forwardRef` を使用してください。React 19 専用へ変更するなら、peer dependency と破壊的変更として明示する必要があります。

### [P2] 既定描画と children の扱いがリポジトリの構成規約に反する — packages/react/src/components/Slider/Thumb.tsx:67

> **状況: 対応済み** — #204 で `Slider.Thumb` / `XYPad.Thumb` を 1 要素にし、既定描画のフォールバックを無くした。

**何が問題か**

Slider と XYPad の Thumb は children がない場合に既定 DOM を描画します。

```tsx
{children ? (
  children
) : (
  <div className={cx('tremolo-slider-thumb', className)} /* ... */ />
)}
```

NumberInput のステッパーも既定アイコンへフォールバックします。

```tsx
{children ?? icon}
```

Piano.Root は `ComponentPropsWithoutRef<'div'>` 経由で children を受け取れますが、それを描画せず、常に `notes.map(...)` の既定キーを描画します。AnimationCanvas だけは namespace オブジェクトではなく関数を直接 export しています。

**どう壊れるか**

コンポーネント間で「Root は children をそのまま描画する」「既定 markup はない」という前提が成立しません。また Slider / XYPad は `children={0}` のような falsy な children まで既定 Thumb に置き換えます。テーマ側が DOM 構造を完全に所有できません。

**対応案**

常に children をそのまま描画し、必要な描画要素は明示的なサブコンポーネントに分けてください。Piano も `Key` などの primitive を namespace に出す構成へ寄せ、AnimationCanvas も `{ Root }` の形に統一します。

### [P2] `useEventListener` の手動 disposer が登録時とは別の target を解除する — packages/react/src/hooks/useEventListener.ts:34

> **状況: 対応する（未対応）** — 戻り値の disposer は呼び出し時に target を再評価するため、登録時と別の要素を解除しうる。現在この戻り値を使っている箇所は無いので、直すか戻り値ごと無くすかは実装時に決める。

**何が問題か**

effect では登録時の `node` を閉じ込めていますが、返却する disposer は target 関数を再評価します。

```ts
useEffect(() => {
  const node = typeof target === 'function' ? target() : (target ?? document)
  // ...
  node.addEventListener(event, listener, options)
  return () => {
    node.removeEventListener(event, listener, options)
  }
}, [event, target, options, listener])

return () => {
  const node = typeof target === 'function' ? target() : (target ?? document)
  node?.removeEventListener(event, listener, options)
}
```

**どう壊れるか**

安定した `() => ref.current` を渡し、登録後に `ref.current` が A から B に変わった状態で disposer を呼ぶと、B から削除しようとします。実際に登録されている A のリスナは残ります。

**対応案**

登録済み target と cleanup を ref に保存し、返却 disposer はその cleanup を呼ぶようにしてください。返却関数自体も安定させるのが望ましいです。

### [P2] `angleRange=360` で Knob の円弧が端点で消える — packages/react/src/components/Knob/context.tsx:63

> **状況: 対応する（未対応）**

**何が問題か**

`angleRange` に制約がなく、1本の SVG arc で全範囲を描画しています。

```ts
const r1 = -angleRange / 2
const r2 = r1 + Math.min(p, s) * angleRange
const r3 = r1 + Math.max(p, s) * angleRange
const r4 = angleRange / 2
```

```tsx
d={`M ${start.x} ${start.y} A ${radius} ${radius} -135 ${
  r3 - r2 > 180 ? 1 : 0
} 1 ${end.x} ${end.y}`}
```

**どう壊れるか**

`angleRange={360}` かつ値が min または max の場合、円弧の始点と終点が同じになります。単一の SVG `A` コマンドでは完全な円を表せないため、active または inactive の円弧が描画されません。360度を超える値も指定角度どおりには表せません。

**対応案**

公開 API を `0 < angleRange < 360` に制限して開発時に検証するか、360度以上を許すなら円弧を複数セグメントへ分割してください。

### [P3] context hooks と関連型の root export がコンポーネント間で揃っていない — packages/react/src/index.ts:10

> **状況: 対応する（未対応）** — `src/index.ts` が `useSliderContext` / `useNumberInputContext` / `usePointsEditorContext` だけを公開し、`useKnobContext` と `useXYPadContext` が漏れていることを確認した。

**何が問題か**

NumberInput、PointsEditor、Slider の context hook は package root から export されていますが、Knob と XYPad は各コンポーネントファイルで export しているのに root barrel から欠落しています。Slider の `MarksOptions` / `MarksType` も同様です。

```ts
export { Knob, type KnobProps, type KnobMethods } from './components/Knob'
```

```ts
export {
  XYPad,
  type XYPadProps,
  // useXYPadContext がない
} from './components/XYPad'
```

また `XYPadMethods` だけが `original: Ref<HTMLDivElement>` を持ち、他の `*Methods` と形・命名・型が異なります。

**どう壊れるか**

package exports が `"."` のみなので、利用者は公開されているはずの `useKnobContext` / `useXYPadContext` を通常の package import から取得できません。`original` も `Ref` union 型のため、`.current` を直接参照できません。

**対応案**

context hooks と関連型を全コンポーネントで export するか、すべて内部 API に統一してください。DOM 要素を公開するなら `element: HTMLDivElement | null` など、他コンポーネントにも適用できる一貫した形にします。

### [P3] `Knob.Thumb` の `className` が無視される — packages/react/src/components/Knob/Thumb.tsx:28

> **状況: 対応する（未対応）** — `className` を受け取りながら描画側では `classes?.thumb` しか使っておらず、捨てられていることを確認した。#204 で Slider / XYPad を直したのと同じ形に揃える。

**何が問題か**

`className` を props から取り出していますが、SVG には `classes?.thumb` しか渡していません。

```ts
export function Thumb({
  className,
  // ...
  classes,
  ...props
}) {
```

```tsx
<svg className={cx('tremolo-knob-thumb', classes?.thumb)} {...props}>
```

**どう壊れるか**

`<Knob.Thumb className="custom" />` としても `custom` は DOM に現れません。他のサブコンポーネントでは通常の `className` が反映されるため、API の期待とも一致しません。

**対応案**

SVG の class へ `className` を含めてください。`classes.thumb` と役割が重複するなら、どちらか一方へ API を整理します。

### [P3] 空文字の mark label を指定できない — packages/react/src/components/Slider/MarksOption.tsx:96

> **状況: 対応する（未対応）** — #204 で直した `children` の truthy 判定と同種の問題。

**何が問題か**

ラベルのフォールバックに論理 OR を使っています。

```tsx
{type !== 'mark' && (
  <div className={cx('tremolo-slider-marks-option-label', classes?.label)}>
    {label || value}
  </div>
)}
```

**どう壊れるか**

`label=""` で表示テキストを空にしようとしても、数値 `value` が表示されます。

**対応案**

未指定だけを判定する `label ?? value` を使用してください。

### [P3] PointsEditor は Point 数だけ同じ wheel listener を登録する — packages/react/src/components/PointsEditor/Point.tsx:214

> **状況: 対応する（未対応）**

**何が問題か**

各 Point が共有 Container を target にして `useWheel` を呼びます。

```ts
useWheel(
  (event) => {
    if (!onChange || readonly || !wheel) return
    if (!element || element.ownerDocument.activeElement !== element) return
    // ...
  },
  { target: containerRef },
)
```

**どう壊れるか**

100個の Point があれば、同じ Container に100個の native wheel listener が付きます。1回の wheel ごとに全ハンドラが起動し、99個は focus 判定後に終了します。点数が多い editor ほど wheel 処理と mount/unmount コストが線形に増えます。

**対応案**

Container に1つだけ listener を置き、現在フォーカス中の point ID と registration を context/ref 経由で参照してください。

### [P3] `useAnimationFrame` が inline callback のレンダーごとにループを作り直す — packages/react/src/hooks/useAnimationFrame.ts:9

> **状況: 対応する（未対応）** — effect の依存に `callback` が入っており、インラインで渡すと毎レンダーで rAF ループを張り直すことを確認した。他の hook と同じく `useCallbackRef` を通す。

**何が問題か**

callback 自体を effect dependency に含めています。

```ts
useEffect(() => {
  const loop = () => {
    reqIdRef.current = requestAnimationFrame(loop)
    callback()
  }

  reqIdRef.current = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(reqIdRef.current)
}, [callback, ...deps])
```

**どう壊れるか**

典型的な `useAnimationFrame(() => setState(...))` では callback が毎レンダー新しくなります。各フレームの state 更新後に既存 rAF を cancel し、別のループを予約し直すため、毎フレーム effect cleanup/setup が発生します。

**対応案**

callback は `useCallbackRef` のような最新値 ref から読み、ループの effect は明示された `deps` だけで管理してください。

## まとめ

- P1: 4件
- P2: 11件
- P3: 5件

優先して直すべき上位3件は次のとおりです。

1. `useMIDIAccess` の Strict Mode 対応
2. ドラッグ中断時の body グローバルスタイル cleanup
3. Piano の発音中ショートカットを keydown 時のノートで追跡する修正

指定に従い、テスト・ビルド・`npx` は実行していません。全指摘はファイル読み取りと検索に基づく静的レビューです。
