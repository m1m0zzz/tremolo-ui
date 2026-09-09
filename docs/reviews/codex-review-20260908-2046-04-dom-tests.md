# codex レビュー: @tremolo-ui/dom（テスト）

- 実行日時: 2026-09-08 21:54 (JST)
- 対象: `packages/dom/__tests__/`
- コミット: `8cc8371`
- 実行: `codex exec --sandbox read-only`（codex-cli 0.153.4）
- 最終確認: 2026-09-10 (`8fd96fe`)

---

## 対応状況

各指摘の最新状況は、本文の「状況」を参照する。

全 P1 / P2 / P3 を判定済み。P1 は再現の有無まで確認した。

---

### [P1] pointer capture 消失を偽装せず、ドラッグが終了しない経路を見逃している — packages/dom/__tests__/pointer/helpers.ts:28

> **状況: 対応済み** — #207 で `lostpointercapture` による終了経路を実装し、capture 消失後の `onDragEnd`、listener、cursor、`selectstart` と二重終了を検証するテストを追加した。

**何が問題か**

偽装は `Set` の更新だけで、実ブラウザが発火する `gotpointercapture` / `lostpointercapture` とイベントのリターゲットを再現しません。

```ts
const captured = new Set<number>()
Object.assign(element, {
  setPointerCapture: (id: number) => captured.add(id),
  releasePointerCapture: (id: number) => captured.delete(id),
  hasPointerCapture: (id: number) => captured.has(id),
})
```

実装は capture 成立時、移動・終了リスナーを element にしか登録しません。

```ts
const moveTarget =
  capture.hasPointerCapture?.(pointerId) === true
    ? element
    : (globalThis.window ?? element)
```

```ts
target.addEventListener('pointermove', handlePointerMove)
target.addEventListener('pointerup', handlePointerUp)
target.addEventListener('pointercancel', handlePointerUp)
```

一方、実ブラウザでは capture 中のイベントは capture target にリターゲットされ、capture が移された／解放された場合は `lostpointercapture` が発火します。[Pointer Events Level 3](https://www.w3.org/TR/pointerevents3/#process-pending-pointer-capture)

**どう壊れるか**

`pointerdown` 後に別の要素が同じ pointer を capture したり、capture 元が DOM から外れたりすると、その後の `pointerup` は元の element に届きません。`createDrag` は `lostpointercapture` を監視しないため、次が残ります。

- `onDragEnd` が呼ばれない
- cursor と `selectstart` 抑止が残る
- `createPianoInput` ではノートが鳴り続ける

現在のテストは常に `element.dispatchEvent(...)` しており、この状態を作れません。また `withPointerCapture()` が返す `captured` も一度も検証されていません。

**対応案**

偽装に capture の取得・移譲・消失を操作する API と `lostpointercapture` 発火を追加し、capture 消失でドラッグが一度だけ終了するテストを追加してください。実装側では `lostpointercapture` を終了経路として扱う必要があります。リターゲットそのものは jsdom で再現しにくいため、最低 1 件は実ブラウザの統合テストで確認するのが安全です。

### [P2] `shouldStart` の拒否経路と「capture より先」という契約が未検証 — packages/dom/src/pointer/drag.ts:246

> **状況: 対応済み** — 拒否時に pointer capture を取得せず lifecycle も開始しないことを検証した。

**何が問題か**

この条件は実装上明確な分岐ですが、`packages/dom/__tests__` に `shouldStart` のテストがありません。

```ts
if (pointers.has(pointerId)) return
if (!multiPointer && pointers.size > 0) return

if (opts.shouldStart && !opts.shouldStart(pointerEvent)) return

const isFirst = pointers.size === 0
// ...
capture.setPointerCapture?.(pointerId)
```

さらに `pointerEvent()` は `button`、`buttons`、`pointerType`、`isPrimary` を指定できず、典型的な開始条件を表現できません。

**どう壊れるか**

例えば実装順が変わり、右クリックを拒否した後にも capture、cursor、`selectstart` リスナーが設定される回帰が起きても検出されません。`createDragValue` の委譲も同様です。

**対応案**

イベント偽装に上記 PointerEvent 属性を追加し、`shouldStart` が false のときに全 callback が未発火、capture が未取得、cursor が未変更であることを検証してください。`update()` 後の新しい predicate も確認対象です。

### [P2] window fallback のテストがインスタンスを破棄せず、後続テストへグローバルリスナーを漏らす — packages/dom/__tests__/pointer/drag.test.ts:321

> **状況: 対応済み** — fallback instance も共通 cleanup の対象へ登録した。

**何が問題か**

このテストだけ `createDrag()` の戻り値を `instances` に登録せず、`pointerup` も送っていません。

```ts
const onDrag = vi.fn()
createDrag(element, { onDrag })

element.dispatchEvent(
  pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
)
window.dispatchEvent(
  pointerEvent('pointermove', { screenX: 10, screenY: 0 }),
)
```

`afterEach` が破棄するのは `setup()` 経由で登録されたインスタンスだけです。

```ts
for (const instance of instances.splice(0)) instance.destroy()
```

**どう壊れるか**

この drag は pointerId 1 を保持したまま、window の `pointermove` / `pointerup` / `pointercancel` と document の `selectstart` を監視し続けます。後続テストの bubbling event を受け、テスト順の変更やランダム実行で偽陰性・偽陽性になります。

**対応案**

戻り値を `instances` に追加するか、`try/finally` で必ず `destroy()` してください。テスト末尾に `pointerup` を送るだけでなく、インスタンス破棄まで確認する方が確実です。

### [P2] mapping が `null` を返したイベントでも lifecycle callback が発火することを見逃している — packages/dom/__tests__/pointer/dragValue.test.ts:109

> **状況: 対応済み** — null mapping で change / start / end の全 callback が発火しないことを検証した。

**何が問題か**

mapping の契約では `null` はイベントを無視する意味です。

```ts
/**
 * @returns the position, or null when it cannot be determined and the event
 * should be ignored.
 */
start: (state: DragState, context: MappingContext) => XY<number> | null
```

しかし実装は `start()` が `null` でも、以前の `lastValue` を使って `onDragStart` を呼びます。

```ts
const position = opts.mapping.start(state, context)
if (position) {
  lastValue = valueOf(position)
  if (opts.updateOnPointerDown) opts.onChange?.(lastValue, state)
}
opts.onDragStart?.(lastValue, state)
```

テストは `onChange` だけを検証しています。

```ts
expect(onChange).not.toHaveBeenCalled()
```

**どう壊れるか**

最初から base element が無ければ `[0, 0]`、前のドラッグ後に element が無くなれば前回値で `onDragStart` と `onDragEnd` が発火します。「無視されたイベント」に対して利用側がドラッグ開始 UIや履歴記録を開始します。

**対応案**

開始が成功したかをドラッグ単位で保持し、`null` のイベントでは lifecycle callback も抑止してください。少なくとも `onDragStart` / `onDragEnd` の未発火をテストに追加し、途中で element が現れる場合の仕様も固定してください。

### [P2] `request()` を複数回成功させた場合の古い MIDIAccess リスナーが未検証 — packages/dom/src/midi/access.ts:107

> **状況: 対応する（未対応）** — 03 の実装側の指摘と同件。

**何が問題か**

成功のたびに新しい access へリスナーを追加しますが、以前の access からは削除しません。

```ts
.then((granted) => {
  if (destroyed) return
  access = granted
  granted.addEventListener('statechange', handleStateChange)
  setState({ midiAccess: granted, error: null, inputs: readInputs() })
})
```

破棄時に削除するのは最後に代入された access だけです。

```ts
access?.removeEventListener('statechange', handleStateChange)
access = null
```

**どう壊れるか**

A、B の順で二度成功すると A にリスナーが残ります。A の `statechange` が B の入力一覧を使って不要な通知を発生させ、`destroy()` 後も A が closure を保持します。並行 request が逆順で resolve すると、古い request の結果が state を上書きします。

**対応案**

新しい grant を採用する前に旧 access からリスナーを外してください。世代番号または request token を用い、「最後に開始した request だけが state を更新する」ことを deferred Promise で検証してください。

### [P2] 「pending request 後の destroy」を検証するはずのテストが request 前に destroy している — packages/dom/__tests__/midi/access.test.ts:171

> **状況: 対応する（未対応）** — テストが意図した状況を作れていない。

**何が問題か**

テスト名に反して、Promise が pending の状態を作っていません。

```ts
const instance = createMIDIAccess()
const listener = vi.fn()
instance.subscribe(listener)

instance.destroy()
instance.request()
```

これは次の早期 return しか通りません。

```ts
function request(options: MIDIAccessOptions = {}) {
  if (destroyed) return
```

成功・失敗 callback 内の分岐は未検証です。

```ts
.then((granted) => {
  if (destroyed) return
```

```ts
.catch((reason: unknown) => {
  if (destroyed) return
```

**どう壊れるか**

`.then` または `.catch` の `destroyed` guard が削除されても、このテストは通ります。実際には request 開始後に unmount すると、破棄済みインスタンスが通知・state 更新・リスナー登録を行います。

**対応案**

制御可能な Promise を返し、`request()` → `destroy()` → resolve/reject の順で実行してください。成功と失敗の両方で state、subscriber、`statechange` 登録が変わらないことを確認します。

### [P2] MIDI input の解除テストが callback の同一性を検証していない — packages/dom/__tests__/midi/message.test.ts:55

> **状況: 対応する（未対応）**

**何が問題か**

解除の検証が `expect.any(Function)` に留まっています。

```ts
expect(a.removeEventListener).toHaveBeenCalledWith(
  'midimessage',
  expect.any(Function),
)
```

偽 input には実際に配送を確認できる `send()` があるにもかかわらず、disconnect/destroy 後には使われていません。

**どう壊れるか**

実装が次のように別関数を渡す回帰を起こしても assertion は通りますが、元の listener は `Set` に残り、切断後も MIDI message が配送されます。

```ts
input.removeEventListener('midimessage', () => listener)
```

**対応案**

disconnect と destroy の後に `a.send(...)` し、handler が呼ばれないことを検証してください。必要なら `addEventListener` と `removeEventListener` の第2引数が `toBe` で同一であることも確認します。

### [P2] Canvas snapshot テストは元画像のコピーが消えても通る — packages/dom/__tests__/canvas/animation.test.ts:296

> **状況: 対応する（未対応）**

**何が問題か**

実装には二つの別 context へのコピーがあります。

```ts
memoContext.drawImage(canvas, 0, 0)
```

```ts
context.drawImage(memo, 0, 0, previousWidth, previousHeight)
```

しかしテストが保持しているのは本体 canvas の context だけで、検証も一回以上の呼び出しだけです。

```ts
// Once onto the memo canvas, once back onto the resized one.
expect(context.drawImage).toHaveBeenCalled()
```

**どう壊れるか**

`memoContext.drawImage(canvas, 0, 0)` を削除しても、空の memo を本体へ戻す二つ目の呼び出しが残るためテストは通ります。実ブラウザでは resize のたびに内容が消えます。

**対応案**

`withContext2D` から canvas ごとの context を取得できるようにし、memo context に `drawImage(canvas, 0, 0)`、本体 context に `drawImage(memo, 0, 0, oldWidth, oldHeight)` がそれぞれ一度呼ばれたことを検証してください。

### [P2] Canvas の描画状態リセットを偽 context が再現せず、`context.ts` の回帰を検出できない — packages/dom/__tests__/canvas/helpers.ts:21

> **状況: 対応する（未対応）**

**何が問題か**

実装は `canvas.width` / `height` の代入で context 状態が初期化される前提で、状態を退避・復元します。

```ts
const state = readDrawingState(context)
memo.width = canvas.width
memo.height = canvas.height
// ...
writeDrawingState(context, state)
```

偽 context は単なるオブジェクトであり、canvas サイズ変更時に `fillStyle` 等を既定値へ戻しません。

```ts
return {
  setTransform: vi.fn(),
  scale: vi.fn(),
  drawImage: vi.fn(),
  strokeStyle: '#000000',
  fillStyle: '#000000',
  globalAlpha: 1,
  // ...
}
```

また、公開されている `drawingState` / `isDrawingState()` を直接検証するテストもありません。

**どう壊れるか**

`writeDrawingState()` の呼び出しや `drawingState` の項目が削除されても、偽 context の値は変更されないため、単純な「resize 後も同じ値」というテストまで偽陽性になります。

**対応案**

canvas の width/height 設定時に context を初期値へ戻す偽装を追加し、非既定の `fillStyle`、`globalAlpha`、`lineWidth` などが復元されることを検証してください。`isDrawingState()` には有効名・未知の文字列・非文字列の直接テストも追加します。

### [P2] `destroy()` が空状態でも変更通知する契約違反をテストが見逃している — packages/dom/__tests__/piano/index.test.ts:334

> **状況: 対応する（未対応）**

**何が問題か**

callback の説明は「activeNotes が変わるとき」です。

```ts
/** Called whenever PianoInputInstance.activeNotes would change. */
onActiveNotesChange?: (notes: number[]) => void
```

しかし `destroy()` は保持ノートがなくても、何度呼ばれても通知します。

```ts
for (const note of activeNotes()) {
  held.delete(note)
  opts.onStopNote?.(note)
}
pointerNotes.clear()
opts.onActiveNotesChange?.([])
```

テストは一度目の `destroy()` 直後しか検証せず、`afterEach` が同じ instance をもう一度 destroy します。

**どう壊れるか**

空の instance の破棄や二重破棄で `onActiveNotesChange([])` が余分に発火し、利用側の再描画、履歴、外部通知が重複します。

**対応案**

破棄前に `held.size > 0` だった場合だけ通知し、destroy を冪等にしてください。「空のまま destroy」と「二度 destroy」で callback が増えないテストを追加します。

### [P3] animation frame の時間値が実質未検証 — packages/dom/__tests__/canvas/animation.test.ts:154

> **状況: 対応する（未対応）**

**何が問題か**

現在の時間 assertion は等値を許すため、常に 0 でも通ります。

```ts
expect(lastFrame(next).elapsedTime).toBeGreaterThanOrEqual(before)
```

`deltaTime` と `fps` には assertion がありません。また偽 rAF は時刻を進めず、渡した timestamp を実装も使用していません。

```ts
for (const callback of callbacks) callback(performance.now())
```

```ts
const now = performance.now()
const deltaTime = now - previousTime
fps: 1000 / deltaTime,
```

**どう壊れるか**

`elapsedTime` が固定値になったり、`previousTime` の更新が消えたり、`fps` が `Infinity` になったりしても検出できません。

**対応案**

`performance.now()` を 1000、1016、1048…のように制御し、`deltaTime`、`elapsedTime`、`fps` を具体値で検証してください。停止・再開時の最初の delta の扱いも固定すると安全です。

### [P3] pointer lock の拒否テストが同期 throw と Promise rejection を通っていない — packages/dom/__tests__/pointer/drag.test.ts:563

> **状況: 対応済み** — 同期 throw と Promise rejection の双方で通常 drag を継続できることを検証した。

**何が問題か**

「refused request」のテストは API 自体を生やしていません。

```ts
const { element, onDrag } = setup({ pointerLock: true })
// No requestPointerLock at all, as on an engine without the API.
```

したがって実装中の二つのエラー経路は未検証です。

```ts
const request = capture.requestPointerLock?.() as
  | Promise<void>
  | undefined
request?.catch?.(() => {})
```

```ts
} catch {
  // requestPointerLock threw synchronously
}
```

**どう壊れるか**

空の `catch` や同期 `try/catch` が削除されても既存テストは通り、ブラウザの拒否時に unhandled rejection または例外が外へ漏れます。

**対応案**

`requestPointerLock` が同期 throw するケースと、`Promise.reject()` を返すケースを別々に追加し、その後も通常 drag が継続することを確認してください。

### [P3] 2D context 取得失敗の公開エラー経路が未検証 — packages/dom/src/canvas/animation.ts:116

> **状況: 対応する（未対応）**

**何が問題か**

明示的なエラー分岐がありますが、テスト helper は常に context を返します。

```ts
const context2d = canvas.getContext('2d', opts.contextAttributes)
if (!context2d) {
  throw new Error('createAnimationCanvas: cannot get a 2d context')
}
```

**どう壊れるか**

エラーメッセージの削除、null の見落とし、後続の null dereference への回帰を検出できません。

**対応案**

`getContext` が null を返す canvas を使い、同期的に意図したエラーを投げることを検証してください。併せて `contextAttributes` が初回だけ渡され、`update()` では変更されない契約も確認できます。

### [P3] `getValue` 必須エラーが未検証 — packages/dom/src/pointer/dragValue.ts:299

> **状況: 対応済み** — relative mapping を公開 API 経由で開始し、明示的な error message を検証した。

**何が問題か**

relative mapping が現在値を要求したときの明示的なエラー経路にテストがありません。

```ts
const getValue = opts.getValue
if (!getValue) {
  throw new Error(
    'createDragValue: getValue is required by the given mapping',
  )
}
```

**どう壊れるか**

`relativeMapping()` に `getValue` を渡し忘れた利用者が `[0, 0]` から開始する、別の例外になる、またはエラーが非同期に握り潰される回帰を検出できません。

**対応案**

`MappingContext.position()` を要求する mapping と `getValue` なしの組み合わせをテストし、エラー内容を固定してください。DOM event listener 内の例外は `dispatchEvent()` から直接再throwされない環境があるため、window の `error` 捕捉などテスト方法を明示する必要があります。

### [P3] `TypeError` のエラー分類だけテーブルから抜けている — packages/dom/__tests__/midi/access.test.ts:116

> **状況: 対応する（未対応）**

**何が問題か**

実装は `NotSupportedError` と `TypeError` を同じ分類にしています。

```ts
if (name === 'NotSupportedError' || name === 'TypeError') {
  return NOT_SUPPORTED
}
```

テーブルには前者しかありません。

```ts
['NotSupportedError', NOT_SUPPORTED],
['AbortError', UNAVAILABLE],
```

また、`toError()` の非 object/null 経路も未検証です。

**どう壊れるか**

`TypeError` が `UNAVAILABLE` に分類されるよう変わってもテストは通り、UIが「非対応」と「一時的な利用不能」を誤って案内します。

**対応案**

`['TypeError', NOT_SUPPORTED]` と、文字列・null rejection が `UNAVAILABLE` になるケースをテーブルへ追加してください。

### [P3] exponentialScale と relativeMapping の同じ不変条件を二箇所で検証している — packages/dom/__tests__/pointer/scaleJump.test.ts:100

> **状況: 対応しない** — 検証対象が別（スケールとマッピング）で、片方が壊れたときに両方落ちること自体は問題ではない。

**何が問題か**

`scaleJump.test.ts` は開始値を変えて「同じ移動量なら同じ倍率」を検証しています。

```ts
const ratio = (from: number) => dragUp(from, axis, [-10])[0] / from
const first = ratio(freq.min)
for (const from of [100, 1000, 10000]) {
  expect(ratio(from)).toBeCloseTo(first, 6)
}
```

`dragValue.test.ts` にも、同じ exponential scale と relative mapping の往復・倍率検証があります。

```ts
expect(lastValue(onChange)[0]).toBeCloseTo(1000 * factor, 6)
// ...
expect(lastValue(onChange)[0]).toBeCloseTo(100 * factor, 6)
```

**どう壊れるか**

scale の仕様変更で同じ原因の失敗が二つの suite に現れ、DOM mapping の回帰なのか scale 数学の回帰なのか切り分けにくくなります。

**対応案**

`dragValue.test.ts` には「カスタム scale の normalize/denormalize が relative mapping で往復する」最小ケースだけを残し、開始値ごとの指数倍率・dead zone 比較は `scaleJump.test.ts` に集約してください。

## まとめ

- P1: 1件
- P2: 9件
- P3: 6件

優先度上位は次の3件です。

1. `lostpointercapture` を扱わないため、実ブラウザでドラッグやピアノのノートが残る経路
2. 複数の MIDI access 成功時に古い `statechange` listener が残る問題
3. Canvas snapshot のコピー元が消えても通る偽陽性

テスト・ビルドは指示どおり実行していません。Pointer capture の判断は W3C Pointer Events 仕様との静的照合であり、実ブラウザ上での再現確認は未検証です。
