# codex レビュー: @tremolo-ui/dom（コード）

- 実行日時: 2026-09-08 21:41 (JST)
- 対象: `packages/dom/src/`
- コミット: `8cc8371`
- 実行: `codex exec --sandbox read-only`（codex-cli 0.153.4）

---

## 対応状況

| 状況 | 件数 |
| --- | --- |
| 対応済み | 0 |
| 対応する（未対応） | 10 |
| 要判断 | 0 |
| 対応しない | 0 |
| 未判断 | 8 |

P1 と P2 は全件を判定済み（P1 は再現の有無まで確認）。P3 は未判断。

---

### [P2] 遅れて成立した pointer lock が `pointerup` / `destroy()` 後に残る — packages/dom/src/pointer/drag.ts:287

> **状況: 対応する（未対応）**

**何が問題か**

pointer lock の要求中であることを保持せず、Promise の成功側も処理していません。

```ts
lockedPointerId = pointerId
globalThis.document?.addEventListener(
  'pointerlockchange',
  handleLockChange,
)
const request = capture.requestPointerLock?.() as
  | Promise<void>
  | undefined
request?.catch?.(() => {})
```

一方、ポインタを離した時点でまだ lock が成立していなければ、リスナを外すだけです。

```ts
lockedPointerId = null
document?.removeEventListener('pointerlockchange', handleLockChange)
if (document?.pointerLockElement === element) document.exitPointerLock?.()
```

**どう壊れるか**

`pointerdown` → 許可待ち → `pointerup` または `destroy()` → 要求成功、の順になると、成功後の `pointerlockchange` を監視するものがありません。ドラッグ終了後やコンポーネント破棄後にカーソルだけが lock され、利用者が Esc で解除するまで残ります。

この非同期順序の実ブラウザ確認は未検証ですが、コード上は成功後の解放経路が存在しません。

**対応案**

要求ごとの世代番号または pending 状態を持ち、成功時に対象 pointer がまだ追跡中か確認してください。終了済みなら即座に `exitPointerLock()` します。Promise を返さない実装も考慮し、pending 中は `pointerlockchange` / `pointerlockerror` の監視を残す必要があります。

### [P2] `lostpointercapture` を監視せずドラッグが終了不能になる — packages/dom/src/pointer/drag.ts:224

> **状況: 対応する（未対応）** — 04 の P1 と同件。実装・テストとも `lostpointercapture` が存在しないことを確認済み。

**何が問題か**

追跡対象には `pointermove`、`pointerup`、`pointercancel` しか登録していません。

```ts
target.addEventListener('pointermove', handlePointerMove)
target.addEventListener('pointerup', handlePointerUp)
target.addEventListener('pointercancel', handlePointerUp)
```

capture が成立すると、追跡先は `element` に固定されます。

```ts
const moveTarget =
  capture.hasPointerCapture?.(pointerId) === true
    ? element
    : (globalThis.window ?? element)
```

**どう壊れるか**

別のコードが `releasePointerCapture(pointerId)` を呼ぶ、要素の状態変化により capture が失われる、といった場合、ポインタが要素外で離されると `pointerup` がこの要素に届きません。`pointers`、`selectstart` リスナ、ドラッグ中カーソルが残り、`onDragEnd` も呼ばれません。Piano では対応するノートが鳴り続けます。

**対応案**

capture 成立時は `lostpointercapture` も監視し、追跡中の pointer ならキャンセルとして確実に `stopTracking()` してください。`releasePointerCapture()` 前には `hasPointerCapture()` を確認し、既に失われている場合でも後始末を完遂できるようにします。

### [P2] 右クリックや補助ボタンでもドラッグを開始する — packages/dom/src/pointer/drag.ts:246

> **状況: 対応する（未対応）** — `createDrag` にボタン種別の判定が無く、`shouldStart` を渡さない限り右クリックでも開始することを確認した。React 側は誰も渡していない。

**何が問題か**

`pointerdown` の `button` を検査せず、そのまま capture と開始コールバックへ進みます。

```ts
if (opts.shouldStart && !opts.shouldStart(pointerEvent)) return

capture.setPointerCapture?.(pointerId)
// ...
opts.onDragStart?.(state(pointerEvent, pointer, 0, 0))
```

**どう壊れるか**

マウスの右クリックや中クリックで Slider/Knob の値が変わり、Piano ではノートが発音します。Piano 側は `shouldStart` を渡していないため、利用側で回避できません。

**対応案**

既定では `pointerEvent.button !== 0` を拒否してください。補助ボタンを利用したい用途があるなら、明示的な opt-in オプションを追加する方が安全です。

### [P2] `pointerup` に含まれる最後の移動を値へ反映しない — packages/dom/src/pointer/dragValue.ts:329

> **状況: 対応する（未対応）** — `onDragEnd` は `lastValue` を返し、コードのコメントも「pointerup までに動いていない」と仮定している。実際には pointerup が座標を持つため、最後の移動が落ちる。

**何が問題か**

`createDrag` は `pointerup` の座標から最終 `DragState` を計算していますが、`createDragValue` の終了処理はその state を mapping に渡しません。

```ts
onDrag: (state) => {
  const position = opts.mapping.move(state, context)
  if (!position) return
  lastValue = valueOf(position)
  opts.onChange?.(lastValue, state)
},
// The pointer has not moved since the last reported value
onDragEnd: (state) => opts.onDragEnd?.(lastValue, state),
```

実際には `createDrag` 側が次のように最終差分を計算しています。

```ts
const deltaX = pointerEvent.screenX - pointer.lastX
const deltaY = pointerEvent.screenY - pointer.lastY
const finalState = state(pointerEvent, pointer, deltaX, deltaY)
```

**どう壊れるか**

`pointerdown` 後、`pointermove` が発火する前に座標 40px の位置で `pointerup` した場合、`onDragEnd` の state は 40px の移動を示す一方、値は開始位置のままです。Slider/Knob の表示値と終了イベントが食い違い、最終移動がコミットされません。

**対応案**

`pointerup` の最終差分が threshold を満たす場合は、終了前に通常の `onDrag` 相当を発火させるか、`createDragValue` が終了 state を mapping に適用してください。`pointercancel` は座標を信用できない場合があるため、通常終了とキャンセルは区別すべきです。

### [P2] mapping が `null` を返しても偽の drag lifecycle を通知する — packages/dom/src/pointer/dragValue.ts:321

> **状況: 対応する（未対応）** — 04 のテスト側の指摘と同件。

**何が問題か**

型のコメントでは `null` のイベントを無視するとしています。

```ts
start: (state: DragState, context: MappingContext) => XY<number> | null
```

しかし実装は値の更新だけを省略し、`onDragStart` を以前の `lastValue` で呼びます。

```ts
const position = opts.mapping.start(state, context)
if (position) {
  lastValue = valueOf(position)
  if (opts.updateOnPointerDown) opts.onChange?.(lastValue, state)
}
opts.onDragStart?.(lastValue, state)
```

**どう壊れるか**

`elementMapping(() => null)` の状態で pointerdown すると、位置を決められないのに `[0, 0]`、または直前のドラッグ値で `onDragStart` が呼ばれます。そのまま終了すると同じ偽の値で `onDragEnd` も呼ばれます。

**対応案**

開始時に `null` ならその gesture を無効として記録し、`onDragStart`、後続 move、`onDragEnd` を通知しないでください。あるいは `createDrag` に開始キャンセル可能な契約を設けます。

### [P2] MIDI の多重 request が競合し、古い結果とリスナが残る — packages/dom/src/midi/access.ts:107

> **状況: 対応する（未対応）** — 04 のテスト側の指摘と同件。

**何が問題か**

「複数回呼べる」とした `request()` に世代管理がなく、成功時に以前の access からリスナを外していません。

```ts
navigator
  .requestMIDIAccess({ sysex: options.sysex ?? false })
  .then((granted) => {
    if (destroyed) return
    access = granted
    granted.addEventListener('statechange', handleStateChange)
    setState({ midiAccess: granted, error: null, inputs: readInputs() })
  })
  .catch((reason: unknown) => {
    if (destroyed) return
    setState({ ...state, error: toError(reason) })
  })
```

`destroy()` が外すのは最後に `access` へ代入された一つだけです。

```ts
access?.removeEventListener('statechange', handleStateChange)
```

**どう壊れるか**

request A の後に B を呼び、B が成功してから A が失敗すると、利用可能な B があるのに `error` が設定されます。A が遅れて成功した場合は新しい B を古い A で上書きします。異なる `MIDIAccess` が返れば、上書きされた access の `statechange` リスナは `destroy()` 後も残ります。

**対応案**

request ID をインクリメントし、最新 request の結果だけを採用してください。新しい access を採用する前に旧 access からリスナを外します。同一オプションの in-flight request を共有する方法でも構いません。

### [P2] `midiMax` を下げても既に鳴っているノートを停止しない — packages/dom/src/piano/index.ts:167

> **状況: 対応する（未対応）** — 05 の Piano の発音残り（P1）と同じ「鳴っているノートを追跡していない」問題。まとめて直す。

**何が問題か**

`midiMax` は `noteOn()` 時にしか検査されず、`update()` は単に設定を置き換えます。

```ts
if (note > (opts.midiMax ?? 127)) return
```

```ts
update: (next) => {
  opts = { ...opts, ...next }
},
```

**どう壊れるか**

ノート 100 を鳴らしたまま `update({ midiMax: 90 })` すると、100 は `activeNotes()` に残り発音し続けます。pointer が同じ鍵上にいる場合は `previous === note` の早期 return により、その後の move でも再評価されません。UI 上は disabled なのに音だけ鳴っている状態になります。

**対応案**

上限が下がった場合、上限超過ノートの全 source を解放して `onStopNote` と `onActiveNotesChange` を通知し、該当する `pointerNotes` も削除してください。既存音には適用しない仕様なら、現在の「Highest note that can sound」という説明を限定する必要があります。

### [P2] canvas の描画状態保持が `reduceFlickering` に依存し、保持対象も不足している — packages/dom/src/canvas/animation.ts:149

> **状況: 対応する（未対応）**

**何が問題か**

`reduceFlickering: false` の場合、画像だけでなく描画状態も読み取りません。

```ts
function takeSnapshot(): DrawingContext | null {
  if (!(opts.reduceFlickering ?? true)) return null
  // ...
  const state = readDrawingState(context)
```

canvas のサイズ変更は context を初期化しますが、`init` は一度しか呼ばれません。

```ts
applyDevicePixelRatio(canvas, context, w, h, dpr)
// ...
if (!initialized) {
  initialized = true
  opts.init?.(context, { width, height })
}
```

さらに保持リストには `filter`、現在の transform、`getLineDash()` の結果などがありません。

```ts
export const drawingState = [
  'strokeStyle',
  'fillStyle',
  'globalAlpha',
  // ...
  'imageSmoothingEnabled',
] as const
```

**どう壊れるか**

`init` で `fillStyle` や transform を設定し、`reduceFlickering: false` で resize すると、次フレームから既定値へ戻ります。`reduceFlickering: true` でも `setLineDash()`、`filter`、追加 transform は失われます。

**対応案**

描画状態の保存を画像 snapshot の有無から分離し、resize ごとに必ず復元してください。プロパティ以外に transform と line dash も明示的に保存する必要があります。

### [P2] snapshot を利用者の合成・透明度・shadow 設定で描き戻している — packages/dom/src/canvas/animation.ts:174

> **状況: 対応する（未対応）** — snapshot の描き戻しは利用者の `globalAlpha` などの影響を受けない状態で行うべき。

**何が問題か**

利用者の描画状態を復元してから snapshot を `drawImage()` しています。

```ts
writeDrawingState(context, state)
context.drawImage(memo, 0, 0, previousWidth, previousHeight)
```

**どう壊れるか**

resize 前の `globalAlpha` が `0.5` なら snapshot 全体が半透明になり、`globalCompositeOperation` が `destination-out` なら描き戻す代わりに消去します。shadow 設定も snapshot 全体へ再適用されます。`reduceFlickering` が既存描画をそのまま保持するという契約を満たしません。

**対応案**

DPR transform だけを設定した中立状態で snapshot を先に描画し、その後で利用者の描画状態を復元してください。`save()` / `restore()` を使う場合も、resize 後の初期状態から snapshot を描く順序にします。

### [P2] CSS サイズが同じだと devicePixelRatio の変化を検出しない — packages/dom/src/canvas/animation.ts:279

> **状況: 対応する（未対応）**

**何が問題か**

DPR を適用するのは `applySize()` の実行時だけで、固定サイズでは幅か高さが変化した場合にしか呼びません。

```ts
if (!relativeSize) {
  const { width: w = 100, height: h = 100 } = opts.size ?? {}
  if (w !== width || h !== height) applySize(w, h)
}
```

animation loop も DPR を確認せず、単に描画します。

```ts
function tick() {
  frameId = requestAnimationFrame(tick)
  drawFrame()
}
```

**どう壊れるか**

Linux 上でブラウザの zoom を変更したり、異なるスケーリングのディスプレイへウィンドウを移動したりして DPR だけが変化すると、CSS サイズは同じなので backing store が古い倍率のままになり、canvas がぼやけます。

**対応案**

最後に適用した DPR を保持し、少なくとも各 animation frame、`redraw()`、`update()` 時に差分を確認してください。非 animation 時も自動追随させるなら、owner window の resize または resolution media query を監視し、`destroy()` で解除します。

### [P3] 要素の owner document/window ではなくグローバル realm を使う — packages/dom/src/pointer/drag.ts:264

> **状況: 未判断**

**何が問題か**

fallback、選択抑止、pointer lock のすべてが `globalThis` を参照します。

```ts
: (globalThis.window ?? element)
```

```ts
globalThis.document?.addEventListener('selectstart', preventSelectStart)
globalThis.document?.addEventListener(
  'pointerlockchange',
  handleLockChange,
)
```

対して `createWheel` は正しく `element.ownerDocument` を使用しています。

**どう壊れるか**

同一 origin の iframe 内要素を親 window のコードから渡すと、pointer lock の event と `pointerLockElement` は iframe の document に属するため検出できません。capture 非対応時の pointer move/up や `selectstart` も別 window/document に登録されます。

**対応案**

生成時に `const ownerDocument = element.ownerDocument` と `const ownerWindow = ownerDocument.defaultView` を取得し、一貫して使用してください。

### [P3] `pixelRange` が 0 の軸で `NaN` / `Infinity` を生成する — packages/dom/src/pointer/dragValue.ts:177

> **状況: 未判断**

**何が問題か**

入力制約を設けずに `pixelRange` で除算しています。

```ts
const travelled = (to: XY<number>, at: number): XY<number> => [
  origin[0] + ((to[0] - anchor[0]) * at) / baseX,
  origin[1] + ((to[1] - anchor[1]) * at) / baseY,
]
```

**どう壊れるか**

`relativeMapping({ pixelRange: [0, 100] })` で y 方向だけに動かした場合でも、x は `0 / 0` となり `NaN` が `onChange` へ渡ります。x に移動すれば `Infinity` となり、scale によっては上限へ飛びます。

**対応案**

各軸について有限かつ `> 0` を生成時に検証して `RangeError` にするか、0 の軸を固定値として扱う仕様を定義してください。

### [P3] Piano の命令 API が MIDI 範囲外・非整数値を受理する — packages/dom/src/piano/index.ts:102

> **状況: 未判断**

**何が問題か**

上限との比較しかありません。

```ts
if (note > (opts.midiMax ?? 127)) return
```

**どう壊れるか**

`noteOn(-1)`、`noteOn(60.5)`、`noteOn(NaN)` はすべて受理され、`onPlayNote` と `activeNotes()` にその値が現れます。MIDI note number として不正で、下流 synth や表示処理へ不正値が流れます。

**対応案**

`Number.isInteger(note) && note >= 0 && note <= Math.min(midiMax, 127)` を検証してください。127 超を独自拡張として許すなら、少なくとも有限整数・非負は保証すべきです。

### [P3] active drag の `destroy()` が lifecycle を閉じない — packages/dom/src/pointer/drag.ts:411

> **状況: 未判断**

**何が問題か**

破棄時は追跡を消すだけで、開始済み pointer に `onDragEnd` または cancel 通知を行いません。

```ts
destroy: () => {
  for (const pointerId of [...pointers.keys()]) stopTracking(pointerId)
  element.removeEventListener('pointerdown', handlePointerDown)
  // ...
}
```

`createDragValue.destroy()` もそのまま委譲しています。

```ts
destroy: () => drag.destroy()
```

**どう壊れるか**

利用者が `onDragStart` で `dragging = true`、`onDragEnd` で false にしている場合、active drag 中の instance 再構築や破棄で状態が true のまま残ります。Piano は独自に全ノートを止めていますが、汎用 Drag/DragValue には同等の回復手段がありません。

**対応案**

破棄による終了を `onDragCancel` として通知するか、`onDragEnd` に終了理由を追加してください。callback を発火しない設計を維持するなら、active pointer を取得できる API と、呼び出し側が状態を戻す必要があることを文書化します。

### [P3] managed style を完全には復元できない — packages/dom/src/pointer/drag.ts:172

> **状況: 未判断**

**何が問題か**

元の値だけを保存し、CSS priority を保存していません。

```ts
previousStyles.set(property, style.getPropertyValue(property))
style.setProperty(property, value)
```

破棄時も priority なしで戻します。

```ts
style.setProperty(property, previous)
```

また、同じ要素に複数 instance を作った場合の参照カウントもありません。

**どう壊れるか**

元が `user-select: text !important` なら、破棄後は `user-select: text` となり `!important` が失われます。二つの instance を同じ要素に作ると、先に作った方の destroy が後の instance の `touch-action: none` を解除し、最後には `none` が残る順序も発生します。

**対応案**

`getPropertyPriority()` も保存して復元してください。複数 instance を許すなら要素単位の `WeakMap` で参照数と原状態を管理するか、非対応であることを明示します。

### [P3] Wheel だけ callback を `update()` で差し替えられない — packages/dom/src/pointer/wheel.ts:49

> **状況: 未判断**

**何が問題か**

`update()` が変更できるのは options だけで、生成時の `onWheel` は固定です。

```ts
return {
  update: (next) => {
    opts = { ...opts, ...next }
  },
  destroy: () => {
    element.removeEventListener('wheel', handler)
  },
}
```

`createDrag` は callbacks を options として更新でき、`createMIDIMessage` も `update(onMIDIMessage)` を提供しているため、公開 API の更新契約が揃っていません。

**どう壊れるか**

framework 非依存の利用者が handler を差し替えるには instance を破棄・再生成する必要があり、不要なリスナ張り直しが発生します。React の callback ref を使うラッパーでは表面化しませんが、DOM API 単体では制約になります。

**対応案**

`onWheel` を `WheelOptions` に含めて `Partial<WheelOptions>` で更新するか、`update(onWheel, options)` の形に統一してください。

### [P3] subscriber の例外を MIDI request の失敗として処理する — packages/dom/src/midi/access.ts:113

> **状況: 未判断**

**何が問題か**

成功 callback 内の `setState()` まで同じ Promise chain の `.catch()` 対象です。

```ts
.requestMIDIAccess(...)
.then((granted) => {
  // ...
  setState({ midiAccess: granted, error: null, inputs: readInputs() })
})
.catch((reason: unknown) => {
  // ...
  setState({ ...state, error: toError(reason) })
})
```

`setState()` は利用者 callback を直接呼びます。

```ts
for (const listener of listeners) listener()
```

**どう壊れるか**

購読 callback が例外を投げると、MIDI access 自体は成功しているのに `.catch()` が実行され、状態が `UNAVAILABLE` に書き換えられます。二度目の通知でも同じ callback が投げれば unhandled rejection になります。

**対応案**

`then(success, failure)` の rejection handler で `requestMIDIAccess()` 自体の失敗だけを処理してください。subscriber 通知も snapshot 化し、必要なら例外の扱いを独立させます。

### [P3] MIDI output の変化でも購読者を再描画させる — packages/dom/src/midi/access.ts:102

> **状況: 未判断**

**何が問題か**

`statechange` の内容を見ず、常に新しい state と input 配列を作ります。

```ts
function handleStateChange() {
  if (destroyed || !access) return
  setState({ ...state, inputs: readInputs() })
}
```

**どう壊れるか**

出力ポートだけが接続・切断された場合も state の identity が変わり、`useSyncExternalStore` などの購読者が再レンダーされます。入力一覧には変化がありません。

**対応案**

`MIDIConnectionEvent.port.type` が `output` のイベントを除外してください。入力については port の connection/state 変化を通知する必要があるため、単純な配列同値比較だけで全イベントを落とさないよう注意が必要です。

a11y: 問題なし。対象コードは markup を生成せず、Piano の非 pointer 入力は `noteOn` / `noteOff` でラッパーへ委ねられています。

規約との乖離: 問題なし。既定描画や CSS 配布、framework 依存はなく、各 factory は命令的 instance と `destroy()` を返しています。

tree shaking: 問題なし。named re-export と `sideEffects: false` の構成で、対象コード内に import 時の副作用もありません。

## まとめ

- P1: 0 件
- P2: 10 件
- P3: 8 件

優先して直すべき上位 3 件は次のとおりです。

1. 非同期 pointer lock が終了・破棄後に成立して残る競合
2. `lostpointercapture` 未処理による追跡・カーソル・ノートの残留
3. `pointerup` の最終移動を `createDragValue` が値へ反映しない問題

指定に従い、テスト・ビルドは実行していません。pointer lock/capture の実ブラウザでのイベント順序は未検証で、該当する順序に入った場合のコード経路を静的に確認しています。
