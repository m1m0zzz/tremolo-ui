# @tremolo-ui/dom

## 0.6.0

### Minor Changes

- [#213](https://github.com/m1m0zzz/tremolo-ui/pull/213) [`91f2486`](https://github.com/m1m0zzz/tremolo-ui/commit/91f24860cedde8f8286546741809a889576da360) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - ドラッグ終了時の移動、pointer lock、複数インスタンスのスタイル管理など、Pointer API の境界条件を修正します。Wheel の callback は `update()` で差し替えられるようになります。

- [#150](https://github.com/m1m0zzz/tremolo-ui/pull/150) [`9c5abb1`](https://github.com/m1m0zzz/tremolo-ui/commit/9c5abb1a69951a31968c50c3000297a8784a2949) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Build out the MIDI input: every channel voice message, the channel they arrived on, and devices that come and go.
  
  Three bugs came out of it:
  
  - **A device plugged in after permission was granted never worked.** `createMIDIMessage` took the input list once, when it was created, so a keyboard connected later got no listener and stayed silent until the component remounted. The device list is now followed through `statechange`.
  - **Pitch bend reported its two bytes the wrong way round.** `onPitchBendEvent(msb, lsb)` was handed `(data[1], data[2])`, but pitch bend sends the low 7 bits first — the opposite order from every other message.
  - **`useMIDIInput` and `useMIDIMessage` resubscribed on every render.** The handlers were effect dependencies, so writing one inline tore the listeners down and built them again each time. They are read fresh on every event now, and the listeners stay put.
  
  Beyond note on/off and pitch bend, `createMIDIInput` now decodes control change, program change, polyphonic aftertouch and channel pressure. Every handler is given the channel last, as 0-15.
  
  ```jsx
  useMIDIInput(midiAccess, {
    onNoteOnEvent: (note, velocity, channel) => play(note, velocity / 127),
    onNoteOffEvent: (note) => stop(note),
    onControlChangeEvent: (controller, value) => {
      if (controller === 1) setModulation(value / 127)
    },
  })
  ```
  
  `createMIDIAccess` gained the rest of what a device UI needs: `inputs` in its state, kept current as devices come and go; `request({ sysex: true })` for system exclusive; and errors told apart rather than flattened — `SecurityError` and `NotAllowedError` become `PERMISSION_DENIED`, `NotSupportedError` becomes `NOT_SUPPORTED`, and everything else becomes the new `UNAVAILABLE`. A user who said no can be asked again; a browser without the API cannot.
  
  Breaking changes:
  
  - `useMIDIInput(access, onNoteOn, onNoteOff, onPitchBend)` takes a handlers object instead: `useMIDIInput(access, { onNoteOnEvent, onNoteOffEvent, ... })`. Seven handlers do not fit in positional arguments
  - `onPitchBendEvent` is `(value, channel)`, where `value` is the 14-bit bend 0-16383, centred at the new `PITCH_BEND_CENTER` (8192), rather than the two raw bytes
  - `useMIDIAccess().request` takes options, so `onClick={request}` has to become `onClick={() => request()}` — otherwise the click event arrives as the options object

- [#208](https://github.com/m1m0zzz/tremolo-ui/pull/208) [`ba7be4b`](https://github.com/m1m0zzz/tremolo-ui/commit/ba7be4b4d4ee46180d577c97f7dd38d5b7da3c45) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Breaking:** Piano keyboard shortcuts now listen from the focused root instead of the whole page by default. The root is a focusable `group`; set `keyboardShortcutsScope="window"` to keep page-wide shortcuts. Held shortcut notes are released when mappings change, focus is lost, or the component unmounts, and shortcuts no longer play outside the displayed range or while editing text.
  
  Lowering `midiMax` now releases active notes above the new limit, including every source and pointer holding them.

- [#259](https://github.com/m1m0zzz/tremolo-ui/pull/259) [`afce3a3`](https://github.com/m1m0zzz/tremolo-ui/commit/afce3a3a89da61ca175f12a159dbd49b86c9c62d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Move the selection box of `PointsEditor` into the core as `createSelectionBox`: which items a rectangle covers, and whether a press adds to the selection or replaces it, no longer live in React. `PointsEditorContextValue.selectionBox` now carries the core's `SelectionBoxRect`, and the React-only `SelectionBox` type is gone.

- [#175](https://github.com/m1m0zzz/tremolo-ui/pull/175) [`eec3e53`](https://github.com/m1m0zzz/tremolo-ui/commit/eec3e53ab2c3b22e940e0fb9d73ee99c0d66fd8f) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Shift makes a `Knob` drag count a tenth as much**, matching what it already
  does on the arrow keys. `dragSensitivity` rebinds it, or takes a bare number to
  use no modifier.
  
  Pressing or releasing the key mid-drag does not disturb the value: the travel
  so far is kept and the new sensitivity applies from the next movement. Holding
  it before the pointer goes down applies it from the first pixel.
  
  `relativeMapping` of `@tremolo-ui/dom` takes a `sensitivity` callback for this,
  read on every move. `selectModifier` of `@tremolo-ui/functions` resolves any
  per-modifier setting, not just an input amount.

- [#187](https://github.com/m1m0zzz/tremolo-ui/pull/187) [`0721aa2`](https://github.com/m1m0zzz/tremolo-ui/commit/0721aa296526cd37fd0d004e184993de16acabd4) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **`PointsEditor` selects points, and a selection moves as one**, with
  `selectable`.
  
  It is off by default. Selection changes what a press and a drag mean, and an
  editor whose points each mean something different — the four handles of an
  ADSR envelope, say — has nothing to gain from moving them together.
  
  - a press selects the point it landed on
  - **ctrl or ⌘ adds to the selection** — not shift, which is the
    fine-adjustment key on every control here and cannot be both
  - a drag on empty space draws a rubber band and selects what it covers
  - dragging or arrow-keying one selected point moves the whole selection
  
  The editor keeps the selection unless you take it over with `selection` /
  `onSelectionChange`. Points are named by their `id` prop, or by one generated
  to last as long as the point is mounted. A selected point carries
  `data-selected="true"`, and the rubber band is
  `.tremolo-points-editor-marquee`.
  
  A selection stops as a whole when any one of its points reaches a limit.
  Clamping each point on its own would leave that one behind while the rest
  carried on, pulling the selection out of shape.
  
  **A drag now moves a point rather than putting it under the pointer.** Grabbing
  a point at its edge used to shift it under the cursor on the first movement.
  It keeps the offset it was grabbed at now — which is also what makes moving
  several at once mean anything.
  
  Deleting and duplicating are not included: the points are yours, and only you
  know what the array behind them is.
  
  `createDrag` of `@tremolo-ui/dom` takes `shouldStart`, which decides whether a
  pointerdown starts a drag at all. It is checked **before the pointer is
  captured**, which is the whole point: a rubber band on a container has to
  decline a press that landed on one of the objects it would select, and
  declining any later means the capture has already been taken away from the
  object that was going to handle it.
  
  `useDragValue`'s handlers receive the `DragState` as a second argument, the
  way `useDrag`'s do.
  
  Two things to know when you turn it on.
  
  **Update each point from the previous state.** A selection calls `onChange` on
  several points in the same tick, so a handler that rebuilds its state from a
  value captured in the render keeps only the last one, and every point but one
  appears stuck:
  
  ```jsx
  // good
  onChange={(v) => setPoints((prev) => ({ ...prev, [id]: v }))}
  // throws away every call but the last
  onChange={(v) => setPoints({ ...points, [id]: v })}
  ```
  
  **The rubber band puts a drag on `PointsEditor.Container`**, and a drag sets
  `touch-action: none` on what it holds, so dragging a finger across the editor
  draws a selection rather than scrolling the page. That was already true over a
  point; with `selectable` it is true over the whole surface. Without it the
  container takes no drag at all.

- [#182](https://github.com/m1m0zzz/tremolo-ui/pull/182) [`30e927a`](https://github.com/m1m0zzz/tremolo-ui/commit/30e927ac00a7b058b6feecd5a4ea4cd42df58e86) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Shift now makes a `Slider`, `XYPad` or `PointsEditor` drag fine, the way it
  already did on `Knob`.** All four take `dragSensitivity`, default
  `{ default: 1, shift: 0.1 }`, and a bare number opts out of modifiers.
  
  These three are different from `Knob`: their value is the position pointed at,
  so a fine drag cannot stay under the pointer. It moves a tenth as fast and the
  two drift apart — and they stay apart once the key is released. Snapping the
  value back under the pointer would move it by however far they had drifted,
  which is a jump nobody asked for.
  
  Pressing or releasing the key partway through does not disturb the value, and a
  plain click still lands where it was aimed.
  
  `elementMapping` of `@tremolo-ui/dom` takes the same `sensitivity` callback
  `relativeMapping` does:
  
  ```ts
  elementMapping(() => track, {
    sensitivity: (state) => (state.event.shiftKey ? 0.1 : 1),
  })
  ```
  
  It reports `origin + (position - anchor) * sensitivity`, where origin and
  anchor only move when the sensitivity does. With no callback the two never
  part, so the result is the raw position and nothing changes.

- [#215](https://github.com/m1m0zzz/tremolo-ui/pull/215) [`12d6463`](https://github.com/m1m0zzz/tremolo-ui/commit/12d6463974c0a98560e3022bef64f5f6f317b7b9) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - 競合する Web MIDI access request と終了後の非同期結果を安全に扱い、Piano の命令 API で MIDI note 範囲を検証します。

- [#219](https://github.com/m1m0zzz/tremolo-ui/pull/219) [`7ec27cc`](https://github.com/m1m0zzz/tremolo-ui/commit/7ec27cc43c97f4d01bb9f6a90557ee22dff5e018) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Keep an animation canvas sharp when the device pixel ratio changes, and preserve its drawing state across every resize. Snapshot pixels are restored with neutral compositing before the caller's styles, line dash, and transform are reinstated.

- [#185](https://github.com/m1m0zzz/tremolo-ui/pull/185) [`5ebb50e`](https://github.com/m1m0zzz/tremolo-ui/commit/5ebb50e458ece38eef60df5cfa750bd00a6ef9ef) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **`pointerLock` hides the cursor for the length of a drag** on `Knob` and
  `NumberInput.Stepper`, reading the pointer movement directly instead of
  following it around the screen.
  
  The reason is not tidiness. A relative drag does not care where the pointer is,
  but it still stops at the edge of the screen: the operating system pins the
  pointer there and the coordinates stop changing, so the value stops moving
  however far you keep dragging. A fine drag — shift held, or a low
  `dragSensitivity` — reaches that edge quickly.
  
  It is off by default. The browser shows a notice of its own, Esc takes the lock
  back, and the request can be refused. A refusal is not an error: the drag
  carries on as an ordinary one, since the coordinates are only read as movement
  once the lock is actually held. Losing the lock ends the drag, because no
  pointerup is coming after it.
  
  Movement that happened while the request was in flight is kept, so the value
  does not jump when the lock takes effect.
  
  Not for `Slider`, `XYPad` or `PointsEditor`: their value is the position
  pointed at, and `clientX` / `clientY` freeze under the lock. `createDrag` and
  `createDragValue` of `@tremolo-ui/dom` take the option, as do the `useDrag` and
  `useDragValue` hooks.

### Patch Changes

- [#207](https://github.com/m1m0zzz/tremolo-ui/pull/207) [`5f12a47`](https://github.com/m1m0zzz/tremolo-ui/commit/5f12a47117b3599350ac57a8fe216c726d4454bf) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - End every active drag when its instance is destroyed or its pointer capture is
  lost. These paths use the existing `onDragEnd` callback, as cleanup is required
  after every drag that started regardless of how the pointer stopped tracking.
  
  React controls now balance the page-wide `user-select: none` they acquire even
  when they unmount or become readonly during a drag.

- [#179](https://github.com/m1m0zzz/tremolo-ui/pull/179) [`e180798`](https://github.com/m1m0zzz/tremolo-ui/commit/e1807981b328c574df9d25facc94e9c7884e43ae) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Values no longer collect binary float debris.** Holding shift and pressing
  the arrow key twelve times from 5 used to reach 5.699999999999998, and the
  input showed exactly that. The fine-adjustment modifier deliberately takes
  `step` out of the pipeline, and `step` was the only thing rounding the
  artefact back.
  
  A value is now rounded to the 15 significant digits a double actually carries,
  at the two places a value is produced: `applyDelta`, which the wheel and the
  arrow keys go through, and `createDragValue`, which every drag goes through.
  Rounding happens before the clamp, so `min` and `max` still have the last word.
  
  This is not rounding in the sense `step` is. `step` puts a value on a grid you
  asked for; this removes digits that were never in the value — the result of a
  float calculation already carries error that size or larger, so nothing real
  is lost. There is no way to turn it off, and no reason to want one.
  
  `toPrecision(x, significantDigits = 15)` is exported from
  `@tremolo-ui/functions` alongside the existing `toFixed`, with
  `SIGNIFICANT_DIGITS` for the default.
- Updated dependencies [[`fc5b383`](https://github.com/m1m0zzz/tremolo-ui/commit/fc5b383c7ca55e6ccd8a648962fedaa51daac422), [`a712bc2`](https://github.com/m1m0zzz/tremolo-ui/commit/a712bc2a2eef095f00aa18f7ce398a89ee4d264a), [`d1dc65f`](https://github.com/m1m0zzz/tremolo-ui/commit/d1dc65f9165b77fdae5a23539be194d804002e4d), [`2ff5c1d`](https://github.com/m1m0zzz/tremolo-ui/commit/2ff5c1db221bf2be7c685ce8149da36d1084819d), [`041483e`](https://github.com/m1m0zzz/tremolo-ui/commit/041483e300a6848daf08e53b998342536053d335), [`e180798`](https://github.com/m1m0zzz/tremolo-ui/commit/e1807981b328c574df9d25facc94e9c7884e43ae), [`e31065c`](https://github.com/m1m0zzz/tremolo-ui/commit/e31065c076d4e163539bd5c34165b1f5c16694dc), [`83fa74b`](https://github.com/m1m0zzz/tremolo-ui/commit/83fa74b9618ea0367a5e08453241e7a190db9b88), [`84cbcdb`](https://github.com/m1m0zzz/tremolo-ui/commit/84cbcdb477cf825ff2206ad447ad0e6cdfb1ab09)]:
  - @tremolo-ui/functions@0.6.0

## 0.5.0

### Minor Changes

- [#139](https://github.com/m1m0zzz/tremolo-ui/pull/139) [`954dc53`](https://github.com/m1m0zzz/tremolo-ui/commit/954dc534f438b9869f92a48bf4199b3db3b84432) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Move the drag-to-value logic into `@tremolo-ui/dom` as `createDragValue`.
  
  `Slider`, `Knob`, `XYPad` and `PointsEditor` each turned pointer movement into a value on their own. They now share one primitive: a *mapping* decides where the pointer sits on the 0-1 travel of each axis, and the axis options (`min` / `max` / `step` / `skew` / `reverse`) turn that into a value, in the same order everywhere — position, `reverse`, `skew`, rounding to the step, clamping to the range.
  
  Two mappings ship with it. `elementMapping` normalizes the pointer against the bounding rect of an element, so the value is the position pointed at (`Slider`, `XYPad`, `PointsEditor`). `relativeMapping` moves the value away from where it stood when the drag started, by the distance dragged (`Knob`).
  
  Breaking: `useDragWithElement` is replaced by `useDragValue`, which reports values rather than normalized coordinates and covers both mappings.
  
  ```jsx
  const { refCallback, dragging } = useDragValue({
    axis: { min: 0, max: 100, step: 1 },
    baseElementRef: trackRef,
    updateOnPointerDown: true,
    onChange: ([x]) => setValue(x),
  })
  ```
  
  Breaking: the `XYOrSingle` type of `XYPad` is now `XYInput`, and its pair form is a `readonly` tuple. A single value is told from a pair with `Array.isArray`, so where the value could itself be an array the single form is dropped and only the pair is left.
  
  `createDrag` and `createDragValue` also gained `update()`, so a wrapper can feed fresh settings in without tearing down the listeners. Changing `min` or `max` while a drag is in progress no longer aborts it.
  
  Fixes a crash when the element a drag normalizes against has collapsed to zero width or height: the position now reads 0 instead of throwing a `RangeError`.

- [#144](https://github.com/m1m0zzz/tremolo-ui/pull/144) [`27209dc`](https://github.com/m1m0zzz/tremolo-ui/commit/27209dc9fd1dc311b689fc36760a25d01c0c1990) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Move the AnimationCanvas loop into `@tremolo-ui/dom` as `createAnimationCanvas`, and stop restarting it on every render
  
  `AnimationCanvas` kept its whole setup — the 2D context, the `ResizeObserver`, the device pixel ratio, the `requestAnimationFrame` loop — inside one effect whose dependencies included `draw`, `init` and `options`. Those are written inline at almost every call site, so they were new on every render and the effect tore everything down and built it again: `init` ran repeatedly, and `count` and `elapsedTime` went back to zero. A canvas next to anything that sets state — a meter reading its level, say — never got past frame 0.
  
  The loop now lives in `@tremolo-ui/dom`:
  
  ```ts
  const instance = createAnimationCanvas(canvas, { draw, animate, size })
  instance.update({ draw: nextDraw }) // swaps the handler, keeps the loop running
  instance.redraw()
  instance.destroy()
  ```
  
  The React component is a wrapper that creates the instance once and pushes fresh handlers in with `update()`, the same shape `useDragValue` already used.
  
  Fixed along the way:
  
  - **`width` and `height` had no effect once mounted.** They were not effect dependencies, so changing them reset the canvas's backing store without re-applying the device pixel ratio transform, leaving the drawing at the wrong scale.
  - **The first size of a `relativeSize` canvas came from `parent.clientWidth`, later ones from the observer's `contentRect`.** Those differ by the parent's padding, so a padded parent drew at one size and then jumped. The `ResizeObserver` now reports every size, including the first.
  - **Resizing blurred the canvas on a HiDPI screen.** The snapshot that carries the drawing across a resize was scaled down by the device pixel ratio on the way out and back up on the way in. The two cancelled out, so it landed in the right place at the right size, but it had been through a downscale and an upscale. It is now copied at the canvas's own device resolution and drawn back at its old CSS size, which is a 1:1 copy of device pixels while the ratio holds — and a single correct rescale from full resolution when the ratio changes.
  - The hidden `<canvas>` used to carry the drawing across a resize is no longer rendered into the document; the core makes one off-document when it needs it.
  
  With `animate` off, `update()` draws a frame: the loop is not running, so a resize and that call are the only things that can put a new drawing on the canvas. That is what keeps the documented "reactive canvas" — `useState` with `animate={false}` — repainting when state changes.
  
  `options` is no longer an effect dependency. It is read once when the context is created, so writing it inline no longer rebuilds the canvas on every render.
  
  `AnimationCanvas` keeps the same props. `@tremolo-ui/dom` gains `createAnimationCanvas`, `drawingState` and `isDrawingState`, with the `AnimationFrame`, `AnimationCanvasOptions` and `AnimationCanvasInstance` types.

- [#142](https://github.com/m1m0zzz/tremolo-ui/pull/142) [`0646236`](https://github.com/m1m0zzz/tremolo-ui/commit/064623612fdbf55366da96773dfa535ff0e63a77) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Replace `skew` with `scale`, and add scales that do not break down at the ends of the range
  
  **Breaking.** The `skew` prop of `Slider.Root`, `Knob.Root`, `XYPad.Root` and `NumberInput.Root`, and `ValueRange.skew` in `@tremolo-ui/functions`, are replaced by `scale`, which takes a `Scale`.
  
  ```diff
  -<Knob.Root min={20} max={22000} skew={skewWithCenterValue(663, 20, 22000)} …>
  +<Knob.Root min={20} max={22000} scale={exponentialScale} …>
  ```
  
  `@tremolo-ui/functions` gains the `Scale` interface and five scales:
  
  - `linearScale` — the default. Equal travel, equal change in value
  - `exponentialScale` — equal travel, equal *ratio*: every octave takes the same distance. For frequency, free running rates and delay times. Requires `min` and `max` to be non-zero and of the same sign
  - `curveScale(curve)` — an exponential bend that still passes through `min` and `max`, so it works on a range that starts at or crosses 0. `curve > 0` favours the lower end, `curve < 0` the upper end. Pair it with `curveWithCenterValue()`
  - `symmetricSkewScale(skew)` — the same bend mirrored about the middle, for a bipolar control that needs fine adjustment around its centre
  - `skewScale(skew)` — the power law of JUCE's `NormalisableRange`, for a value that has to agree with a JUCE or iPlug2 parameter. `skewWithCenterValue()` still applies to it
  
  A `Scale` takes `min` and `max` as arguments rather than holding them, so it carries no state and can be a module level constant.
  
  `normalizeValue()` and `rawValue()` lose their `skew` parameter and are now the linear mapping alone — every curve lives in a `Scale`. `applyDelta()` takes the scale through its `ValueRange`. `skewWithCenterValue()`, `ValueRange` and `applyDelta()` keep their behaviour and move next to the scales they belong to; the names exported from the package are unchanged.
  
  ```diff
  -normalizeValue(value, min, max, skew)
  +skewScale(skew).normalize(value, min, max)
  -rawValue(position, min, max, skew)
  +skewScale(skew).denormalize(position, min, max)
  ```
  
  This fixes the value jumping on a knob with a logarithmic scale. The power law is applied to `value - min`, so its slope at `min` is either infinite or zero: a dB knob over `-60..6` moved 12% of its range on the first pixel of a drag, and a frequency knob over `20..22000` did not move at all for the first 12 pixels. `exponentialScale` and `curveScale` have neither problem. `skewScale` still behaves this way, since matching JUCE is the point of it.

- [#146](https://github.com/m1m0zzz/tremolo-ui/pull/146) [`fe74061`](https://github.com/m1m0zzz/tremolo-ui/commit/fe74061f7e746a958ebe82aeb5a3aa8bad72407b) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Redesign `Piano`: the keyboard is no longer built from key components, and several fingers can play at once.
  
  `Piano.Root` used to draw nothing on its own — a note only sounded because `Piano.WhiteKey` / `Piano.BlackKey` called `onPlayNote` from an imperative handle, which `Root` reached through an array of refs indexed by the order of its children. Custom children, or children in a different order, silently broke both the sound and the highlighting. The key geometry was kept in two places as well: `Root` hit-tested with its own white key width while each key drew itself with its own `width` prop, so `<Piano.WhiteKey width={60} />` drew a key that responded somewhere else.
  
  `Root` now owns the keys and everything that is sounding. Per-key customization is two callbacks rather than a component per key.
  
  ```jsx
  <Piano.Root
    noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
    label={(note, { index }) => SHORTCUTS.HOME_ROW.keys[index]}
    keyProps={(note) => ({ 'data-in-scale': inScale(note, root, 'major') })}
    onPlayNote={(note) => synth.triggerAttack(noteName(note))}
    onStopNote={(note) => synth.triggerRelease(noteName(note))}
  />
  ```
  
  Each key carries `data-note`, `data-note-key`, `data-active` and `aria-disabled`, so static styling needs no callback at all. The geometry of a key is applied after whatever `keyProps` returns, so a key can no longer be drawn away from where it responds.
  
  Every way of playing a note — pointers, keyboard shortcuts, `playNote()` from the ref — now goes through one instance that counts the sources holding each note, so a note stops only once the last of them lets go. Multi-touch and glissando work: `createDrag` gained `multiPointer`, and `@tremolo-ui/dom` gained `createPianoInput`.
  
  Also new in `@tremolo-ui/functions`: musical scales (`scaleIntervals`, `inScale`, `scaleNotes`) in `midi`, and the piano geometry (`PianoLayout`, `notePosition`, `noteAt`, `pianoWidth`) in `piano`.
  
  Breaking changes:
  
  - `Piano.WhiteKey`, `Piano.BlackKey`, `Piano.KeyLabel` and the `KeyProps` / `KeyMethods` / `KeyLabelProps` types are removed. Use `label` and `keyProps`, or plain CSS on `.tremolo-piano-white-key` / `.tremolo-piano-black-key`
  - `label` takes `(note, state)` rather than `(note, index)`; the index is `state.index`. A label of `''`, `null` or `undefined` now draws nothing rather than an empty box
  - `getNoteRangeArray` and the `NoteRange` type moved to `@tremolo-ui/functions`
  - `whiteNoteWidth` is now `whiteKeyWidth`, and the dead `blackNoteWidth` prop is replaced by `blackKeyWidthRatio` / `blackKeyHeightRatio` / `keyGap`
  - `KeyboardShortcuts.flags` is removed. It was declared but never implemented; `SHORTCUTS.HOME_ROW_NATURAL` covers what `naturalOnly` was for, by leaving an empty string where a note has no shortcut

- [#141](https://github.com/m1m0zzz/tremolo-ui/pull/141) [`95df589`](https://github.com/m1m0zzz/tremolo-ui/commit/95df589c481b536bf9bab428692b6265fcf0d557) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Rebuild `NumberInput` on the compound pattern the other components already use, and give it one piece of state: the text being typed.
  
  The value is a `number`, and what the input shows is `format(value)` — except while the user is typing, when their own text stands until it is committed. Everything else is derived during render. The `<input>` is no longer rendered for you; compose it as `NumberInput.InputField`, the way `Slider.Track` is composed.
  
  ```jsx
  <NumberInput.Root value={value} min={0} max={100} units="Hz" onChange={setValue}>
    <NumberInput.InputField />
    <NumberInput.Stepper>
      <NumberInput.IncrementStepper />
      <NumberInput.DecrementStepper />
    </NumberInput.Stepper>
  </NumberInput.Root>
  ```
  
  Keeping the typed text rather than reformatting it on every keystroke removes the cursor-position restoring that used to be needed, and lets a value be entered digit by digit: typing is never clamped, and the entry is brought into range when it is committed on blur or Enter.
  
  Breaking changes to `NumberInput`:
  
  - `children` is required, and `InputField` has to be composed in. There is no default markup to fall back to
  - `value` is a `number`; a `string` is no longer accepted
  - `onChange` reports `(value: number)` rather than `(value, text)`
  - `variant`, `activeColor` and `wrapperClassName` are gone. `Root` is the wrapper, so its `className` styles it, and the colors are CSS variables. The four variants are shown in the documentation as CSS to copy
  - `keepWithinRange` and `clampValueOnBlur` are one `clampValue` prop (default `true`)
  - `selectWithFocus` and `blurOnEnter` moved to `InputField`, as `selectOnFocus` and `blurOnEnter`. Its `onFocus` / `onBlur` are plain DOM handlers
  - `Stepper` lost `dynamic`, and the steppers lost `size`: both are styling, now the `--stepper-icon-size` variable and the demo CSS
  - the class names follow the parts: `tremolo-number-input` is the root and `tremolo-number-input-field` the input, where the root used to be `tremolo-number-input-wrapper`
  - `data-error` is `data-out-of-range`
  
  New in `NumberInput`: `skew`, `format` / `parse` for text the units cannot express, and dragging the `Stepper` up and down to move the value, one `step` every `drag` pixels (1 by default). It needs no range to work against, so an unbounded input can be dragged too.
  
  The `<input>` is now the tab stop and carries the spinbutton role and range, where the wrapper used to take focus and the input was skipped.
  
  Wheel control now only acts while the focus is inside the component, across `Slider`, `Knob`, `XYPad` and `NumberInput`. Reacting on hover alone took the scroll away from the page, so passing over a control while reading changed its value. `createWheel` gained a `requireFocus` option, and `update()`.
  
  `@tremolo-ui/functions` gains `formatValue`, `parseValue`, `selectUnit` and the `Units` type, moved out of `@tremolo-ui/react` so that they are available to any wrapper.
  
  It also gains `applyDelta`, which moves a value by one wheel notch or arrow key press. `Slider`, `Knob`, `XYPad` and `NumberInput` each had their own copy of this; they now share one, and `AxisOptions` of `@tremolo-ui/dom` extends its `ValueRange`, so a drag and a nudge describe their scaling the same way.
  
  Fixes `NumberInput` throwing `"min" and "max" are required` from `wheel` or `keyboard` in `normalized` mode whenever `min` was `0`, which a truthiness check rejected.

### Patch Changes

- [#137](https://github.com/m1m0zzz/tremolo-ui/pull/137) [`68f05cb`](https://github.com/m1m0zzz/tremolo-ui/commit/68f05cb7d8fbe896da47915837882ad08cb5ad95) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Fix a slow drag not registering. Movement below `createDrag`'s threshold was discarded instead of carried over, and pointer coordinates are fractional, so dragging slowly moved less than a pixel per event and never reported anything. It now accumulates until it crosses the threshold.
  
  The threshold also now defaults to 0 in `createDrag`, which restores `useDragWithElement` (used by `Slider`, `XYPad` and `PointsEditor`) to having no threshold at all, as it did before the move to `@tremolo-ui/dom`. `useDrag` still defaults to 1.
- Updated dependencies [[`0646236`](https://github.com/m1m0zzz/tremolo-ui/commit/064623612fdbf55366da96773dfa535ff0e63a77), [`fe74061`](https://github.com/m1m0zzz/tremolo-ui/commit/fe74061f7e746a958ebe82aeb5a3aa8bad72407b), [`95df589`](https://github.com/m1m0zzz/tremolo-ui/commit/95df589c481b536bf9bab428692b6265fcf0d557)]:
  - @tremolo-ui/functions@0.5.0

## 0.4.0

### Minor Changes

- [#133](https://github.com/m1m0zzz/tremolo-ui/pull/133) [`c0bda83`](https://github.com/m1m0zzz/tremolo-ui/commit/c0bda8399f2ba686b9ce2144dd4341b26ae0eb34) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Move pointer drag and wheel handling into `@tremolo-ui/dom` as `createDrag` and `createWheel`.
  
  `createDrag` uses Pointer Events only and relies on pointer capture, so the drag keeps working once the pointer leaves the element and no window level listeners are needed. It applies `touch-action: none` so that touch dragging does not scroll the page, and cancels `selectstart` so that a long press does not start a text selection instead.
  
  The drag cursor (`externalStyles.cursor`) is now applied to the dragged element rather than to `document.body`. Pointer capture keeps it in effect once the pointer leaves the element, so there is no need to restyle the whole document, and long pressing no longer flashes a selection across the page.
  
  Fixes a bug where a drag starting at screen coordinate 0 (the top or left edge of the screen) never reported any movement, and a bug where `useDragWithElement` passed stale coordinates to `onDragStart`.
  
  `Slider` and `XYPad` now move to the pointer position on pointer down, instead of waiting for the first movement.
  
  Breaking: `useDrag` now returns a single ref callback instead of `[refCallback, pointerDownHandler]`, and `useDragWithElement` returns `{ refCallback, dragging }` instead of `{ refHandler, pointerDownHandler, dragging }`. A new `useWheel` hook is exported.
  
  Breaking: `DragObserver` and `WheelObserver` are removed. They had become thin wrappers around `useDrag` and `useWheel`, which replace them.

## 0.3.0

### Minor Changes

- [`2a40e1c`](https://github.com/m1m0zzz/tremolo-ui/commit/2a40e1c50c57c44a2bdbd7d67310488f66d4b9c1) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `@tremolo-ui/dom`, a framework-agnostic DOM layer, and move the Web MIDI logic into it as `createMIDIAccess` / `createMIDIMessage` / `createMIDIInput`.
  
  `useMIDIAccess`, `useMIDIMessage` and `useMIDIInput` keep the same signatures and now call the core internally.
