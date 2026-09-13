# @tremolo-ui/react

## 0.6.0

### Minor Changes

- [#240](https://github.com/m1m0zzz/tremolo-ui/pull/240) [`32c6e1b`](https://github.com/m1m0zzz/tremolo-ui/commit/32c6e1ba9b91ff17d925720c88c465f09a9ee8c7) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Replace the `type` prop of `Slider.MarksOption` with `mark` and `label`. `mark={false}` leaves the mark out, `label={null}` leaves the label out, and any other label — including an empty string — is drawn as given instead of falling back to the value. `Slider.Marks` takes the interval directly (`options="step"`, `options={25}`), with `options={{ per, mark, label }}` for a set without marks or without labels.

- [#266](https://github.com/m1m0zzz/tremolo-ui/pull/266) [`083ab5e`](https://github.com/m1m0zzz/tremolo-ui/commit/083ab5e7efc61ccae3b78c0cdb1c086a78256cc7) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Take the accessible name through the standard `aria-*` props. `XYPad.Thumb` accepts `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-valuetext` — one value for both axes, or a pair for one each — in place of `ariaLabels` and `ariaValueText` on `XYPad.Root`, and `PointsEditor.Point` takes `aria-label` and `aria-valuetext` the same way. They reach the range inputs that carry the semantics; passing them before only decorated the wrapper.

- [#209](https://github.com/m1m0zzz/tremolo-ui/pull/209) [`f39293c`](https://github.com/m1m0zzz/tremolo-ui/commit/f39293c8c881cf14a8f97f3dfdacc972c7d29468) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Keep MIDI access connected through React Strict Mode effect replays, and stop long-press repetition when the pointer is cancelled or the window loses focus.

- [#210](https://github.com/m1m0zzz/tremolo-ui/pull/210) [`4fff346`](https://github.com/m1m0zzz/tremolo-ui/commit/4fff346e192555db0a0818e41d29ade74edfd5d9) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Make `disabled` prevent value changes and remove interactive controls from the
  tab order across Knob, Slider, XYPad, NumberInput, and PointsEditor. Prevent a
  read-only Knob from restoring its default value on double-click.

- [#222](https://github.com/m1m0zzz/tremolo-ui/pull/222) [`c8c10f3`](https://github.com/m1m0zzz/tremolo-ui/commit/c8c10f311df9262d8d6487a52c37cbc7d1d6bc5c) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Render Slider semantics on a visually hidden native range input inside the thumb so focus and accessible value information stay on the same element.

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

- [#214](https://github.com/m1m0zzz/tremolo-ui/pull/214) [`fc5b383`](https://github.com/m1m0zzz/tremolo-ui/commit/fc5b383c7ca55e6ccd8a648962fedaa51daac422) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - 数値・音名・Piano geometry の境界条件を検証し、不正値や極端な有限値にも一貫した結果を返すよう修正します。`InputEventOptions` 型エイリアスを削除し、`ModifierValue<InputEventOption>` に統一します。

- [#224](https://github.com/m1m0zzz/tremolo-ui/pull/224) [`398b47e`](https://github.com/m1m0zzz/tremolo-ui/commit/398b47e44bd6963106e7fe9809296ed80cfd29b7) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Restore React 18 ref support for NumberInput, PointsEditor, Slider, and XYPad subcomponents by wrapping their exported definitions in forwardRef.

- [#259](https://github.com/m1m0zzz/tremolo-ui/pull/259) [`afce3a3`](https://github.com/m1m0zzz/tremolo-ui/commit/afce3a3a89da61ca175f12a159dbd49b86c9c62d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Move the selection box of `PointsEditor` into the core as `createSelectionBox`: which items a rectangle covers, and whether a press adds to the selection or replaces it, no longer live in React. `PointsEditorContextValue.selectionBox` now carries the core's `SelectionBoxRect`, and the React-only `SelectionBox` type is gone.

- [#186](https://github.com/m1m0zzz/tremolo-ui/pull/186) [`cedd509`](https://github.com/m1m0zzz/tremolo-ui/commit/cedd5091d38212d24551c4c57f6e5d0db10ecdca) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Every appearance prop now writes a custom property, and the default moved
  into the CSS.**
  
  ```jsx
  <Slider.Track thickness={16} />
  // is exactly
  <Slider.Track style={{ '--thickness': '16px' }} />
  ```
  
  Four different shapes had grown up for the same idea: a prop that fell through
  to the CSS (`Knob`'s `size`), a prop with a default in JavaScript that a
  stylesheet could not override without `!important` (`Slider.Track`'s `length`
  and `thickness`), a gradient built inline that CSS could not reach at all, and
  a prop that set a custom property (`Slider.Thumb`'s `color`). The last one won.
  
  The prop, a stylesheet rule and an inline style are now three ways to say one
  thing, and the usual cascade decides. Because the default lives in the CSS, one
  rule changes every instance:
  
  ```css
  .tremolo-slider-track {
    --thickness: 16px;
  }
  ```
  
  A number is taken as pixels; a string is written through, so `'3rem'`,
  `'100%'` and `'auto'` all work.
  
  **`Slider.Track` no longer paints itself, and `defaultStyle` is gone.** The
  track publishes `--percent` — where the value sits, the one number CSS cannot
  work out on its own — and the fill is a rule in the theme. Drawing the track
  yourself means writing that rule rather than opting out of ours.
  
  Positions computed from the value stay inline: a thumb's `left`, a point's
  `top`, the `left` of a piano key. Those are the value, not a style.
  
  New state attributes: `data-flipped` on `Slider.Track` for a value that grows
  from the far end, `data-fill` on `Piano`, and `data-vertical` on
  `Slider.Marks`.
  
  If you are not using the theme from the docs, `Slider.Track`, `XYPad.Area`,
  `PointsEditor`, `PointsEditor.Point` and `Piano` no longer carry a size of
  their own — give them one, in CSS or through the props that now feed it.

- [#267](https://github.com/m1m0zzz/tremolo-ui/pull/267) [`1c36b92`](https://github.com/m1m0zzz/tremolo-ui/commit/1c36b9299ad2e97bfd15bd19bb9cf945a77e6f2e) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Place the parts from the component rather than from the stylesheet. A thumb, a mark, a point and the selection box take themselves out of flow and centre on the value they are given, and the layers of `PointsEditor` and the keys of `Piano` keep their order whichever way they are written — so a stylesheet of your own cannot put a part in the wrong place by leaving a rule out. Where the placement has room for taste, `--translate` moves a thumb, a mark or a point off its centre.

- [#171](https://github.com/m1m0zzz/tremolo-ui/pull/171) [`e3aa356`](https://github.com/m1m0zzz/tremolo-ui/commit/e3aa3565a659a337e9664fb67f71ded1ae4719d3) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Shift is now the fine-adjustment key on the arrow keys.** Every component
  moves by a tenth of a step with it held, which is the convention on hardware
  controllers and in every DAW.
  
  `wheel` and `keyboard` accept a map naming the modifier if you want something
  else, and a plain tuple opts out of modifiers entirely:
  
  ```tsx
  keyboard={{ default: ['raw', 1], alt: ['raw', 0.5] }}
  keyboard={['raw', 1]}
  ```
  
  Nothing is bound on the wheel: browsers turn shift+wheel into horizontal
  scrolling, so shift is not ours to take there.
  
  Fixes shift+wheel on `XYPad` and `PointsEditor`, which could only ever raise
  the x value. The direction was read from `deltaY`, which browsers leave empty
  once they move the scroll to `deltaX`. A trackpad's own horizontal gesture now
  moves x too, with no modifier.

- [#175](https://github.com/m1m0zzz/tremolo-ui/pull/175) [`eec3e53`](https://github.com/m1m0zzz/tremolo-ui/commit/eec3e53ab2c3b22e940e0fb9d73ee99c0d66fd8f) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Shift makes a `Knob` drag count a tenth as much**, matching what it already
  does on the arrow keys. `dragSensitivity` rebinds it, or takes a bare number to
  use no modifier.
  
  Pressing or releasing the key mid-drag does not disturb the value: the travel
  so far is kept and the new sensitivity applies from the next movement. Holding
  it before the pointer goes down applies it from the first pixel.
  
  `relativeMapping` of `@tremolo-ui/dom` takes a `sensitivity` callback for this,
  read on every move. `selectModifier` of `@tremolo-ui/functions` resolves any
  per-modifier setting, not just an input amount.

- [#241](https://github.com/m1m0zzz/tremolo-ui/pull/241) [`4187480`](https://github.com/m1m0zzz/tremolo-ui/commit/4187480cdb9811f88b4eef743e2d3a82ca4b84a0) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Listen for the wheel once on `PointsEditor.Container` instead of once per `PointsEditor.Point`. The focused point still takes the notch from anywhere over the editor, but the number of native listeners no longer grows with the number of points. `PointsEditorContextValue` gains `nudgeFocusedPoint`, and a point's registration now carries its element and its resolved wheel option.

- [#257](https://github.com/m1m0zzz/tremolo-ui/pull/257) [`f9f8619`](https://github.com/m1m0zzz/tremolo-ui/commit/f9f8619331879a7838f3264493e5a9064f3455c4) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Rename the rubber band of `PointsEditor` to the selection box. The element is now `.tremolo-points-editor-selection-box`, and `PointsEditorContextValue` carries `selectionBox`, `beginSelectionBox`, `moveSelectionBox` and `endSelectionBox` in place of the `marquee` names.

- [#165](https://github.com/m1m0zzz/tremolo-ui/pull/165) [`81fc481`](https://github.com/m1m0zzz/tremolo-ui/commit/81fc4813d727f90acb5118dba2b06b1174ed5c71) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **`@tremolo-ui/react` no longer ships any CSS.** The `./styles/*.css` export
  paths are gone, `dist/index.css` is no longer built, and importing either one
  now fails to resolve.
  
  Components still render the same `tremolo-` class names and the same
  `aria-*` / `data-*` state attributes, so the appearance is a stylesheet away —
  it just has to be yours. The theme the documentation uses is published at
  [Styling](https://tremolo-ui.mimoz.dev/docs/tutorials/styling) as six plain
  CSS files to copy from.
  
  ```diff
  - import '@tremolo-ui/react/styles/index.css'
  + import './tremolo-theme.css' // copied from the Styling page
  ```

- [#183](https://github.com/m1m0zzz/tremolo-ui/pull/183) [`a712bc2`](https://github.com/m1m0zzz/tremolo-ui/commit/a712bc2a2eef095f00aa18f7ce398a89ee4d264a) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Shift makes a `NumberInput.Stepper` drag fine too.** `dragSensitivity` on
  `NumberInput.Root` says how much the drag counts per modifier key, default
  `{ default: 1, shift: 0.1 }`: `drag` pixels then move a tenth of a `step`
  rather than a whole one. As on the arrow keys, a modifier amount is not
  snapped back onto the grid.
  
  The three handlers of `useDrag` now receive the whole `DragState`. `onDrag`
  had only the four numbers, and the modifier keys live on the event:
  
  ```ts
  useDrag({ onDrag: (x, y, deltaX, deltaY, state) => state.event.shiftKey })
  ```
  
  Arguments were added rather than replaced, so existing handlers keep working.
  
  `mapModifier` is new in `@tremolo-ui/functions`. It carries a per-modifier
  setting over to another kind of setting, keeping which modifier each belongs
  to:
  
  ```ts
  mapModifier({ default: 1, shift: 0.1 }, (f) => ['raw', step * f])
  // { default: ['raw', 1], shift: ['raw', 0.1] }
  ```
  
  Keeping the map rather than resolving it first is what lets a fine drag move
  at all — naming a modifier is also what takes `step` out of the pipeline.

- [#157](https://github.com/m1m0zzz/tremolo-ui/pull/157) [`2ff5c1d`](https://github.com/m1m0zzz/tremolo-ui/commit/2ff5c1db221bf2be7c685ce8149da36d1084819d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `NumberInput` no longer takes `units` or `digit`. `format` and `parse` are the
  only way to control the displayed text, and `unitFormat` builds both:
  
  ```tsx
  - <NumberInput.Root units={[['Hz', 1], ['kHz', 1000]]} digit={2} ... >
  + <NumberInput.Root {...unitFormat('Hz', { digits: 2 })} ... >
  ```
  
  `Units`, `formatValue`, `parseValue` and `selectUnit` are removed from
  `@tremolo-ui/functions` along with them.
  
  `parse` now reads text with no number in it as `NaN`, and the input keeps its
  current value instead of committing a zero the user never typed.

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

- [#177](https://github.com/m1m0zzz/tremolo-ui/pull/177) [`c01b036`](https://github.com/m1m0zzz/tremolo-ui/commit/c01b036d80ce4e6a110d077c7893090fa1787437) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `NumberInput.InputField` takes `keepCaretOnStep`, which puts the caret back
  where it was after an arrow key steps the value. Without it a controlled input
  drops the caret at the end, so holding the key down always acts on the last
  digit and a column cannot be held.
  
  The position is measured from the decimal point, so it survives the number
  changing length: the caret between `9` and `.9` is still between `10` and `.0`.
  
  Arrow keys no longer step the value while an IME is converting, where they
  belong to the candidate list.

- [#169](https://github.com/m1m0zzz/tremolo-ui/pull/169) [`3e307df`](https://github.com/m1m0zzz/tremolo-ui/commit/3e307df8e6e42873f22dd6155a025d56fd697f4c) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `NumberInput.InputField` takes `unformatOnFocus`. With it set, the field drops
  whatever `format` put around the value while it has focus and shows the plain
  number, so a field reading `1.23kHz` offers `1230` to type over.
  
  The number shown is the value itself rather than the number inside the
  formatted text — `1.23` would read back as 1.23 and lose a factor of a
  thousand. That also stops a rounded display becoming the value: a field with
  `digits: 0` showing `2Hz` for 1.6 now offers `1.6` for editing.
  
  Off by default.

- [#263](https://github.com/m1m0zzz/tremolo-ui/pull/263) [`593c112`](https://github.com/m1m0zzz/tremolo-ui/commit/593c112139ed22464cc766153f1f2c391771c8b1) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Name the orientation on `Slider` instead of asking whether it is vertical: the parts now carry `data-orientation="horizontal"` or `data-orientation="vertical"` in place of `data-vertical`, which is what the rest of the ecosystem uses. The `data-axis` on `XYPad`'s inputs is `x` / `y` as well, matching `PointsEditor`.

- [#204](https://github.com/m1m0zzz/tremolo-ui/pull/204) [`5e4aed7`](https://github.com/m1m0zzz/tremolo-ui/commit/5e4aed79d5f6a5d2ee9db408347b92fca910d6a6) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **`Slider.Thumb` and `XYPad.Thumb` are one element**, and `children` are
  rendered inside it.
  
  The thumb used to be a positioned wrapper around either the caller's children
  or a default thumb of its own. The wrapper could not be given a `className` or
  a `style` — `XYPad.Thumb` took `wrapperClassName` and `wrapperStyle` for it and
  `Slider.Thumb` had no way at all — and passing children silently dropped
  `className` and `style`, along with the ref that `Root.focus()` and the
  focus-on-drag both go through.
  
  Now there is a single element. It carries the position, the class name, the
  state attributes and the focus, and whatever is passed as `children` is drawn
  inside it.
  
  ```diff
  -<Slider.Thumb>
  -  <img src="thumb.png" />
  -</Slider.Thumb>
  +<Slider.Thumb style={{ background: 'none', width: 'auto', height: 'auto' }}>
  +  <img src="thumb.png" />
  +</Slider.Thumb>
  ```
  
  **Breaking.**
  
  - The `tremolo-slider-thumb-wrapper` and `tremolo-xy-pad-thumb-wrapper`
    elements are gone. CSS written against them belongs on
    `tremolo-slider-thumb` / `tremolo-xy-pad-thumb`, which now needs the
    positioning the wrapper used to hold: `position: absolute` and a
    `translate: -50% -50%` to centre it on its point
  - `XYPad.Thumb` no longer takes `wrapperClassName` or `wrapperStyle`. Its
    `className` and `style` reach the same element those used to
  - Children no longer replace the thumb. Where they were a whole replacement,
    turn the thumb's own appearance off through `style` or `className`
  - A thumb was hidden by passing an empty fragment as its children, which the
    truthiness check read as "the caller drew something". Use
    `style={{ display: 'none' }}`
  - `children` of `0` or `''` now render, instead of being replaced by the
    default thumb
  
  `Slider.Thumb` also accepts the props of the `div` it renders, as
  `XYPad.Thumb` already did.

- [#211](https://github.com/m1m0zzz/tremolo-ui/pull/211) [`0e3e40f`](https://github.com/m1m0zzz/tremolo-ui/commit/0e3e40fdd60d11d79f32ea5432460580925b5c3e) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Export `composeRefs` and `useComposedRefs` from the `@tremolo-ui/react/compose-refs` subpath.

- [#251](https://github.com/m1m0zzz/tremolo-ui/pull/251) [`e318684`](https://github.com/m1m0zzz/tremolo-ui/commit/e3186844d67446c63a1424e7507579e9eb4e85ce) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Draw the children of `PointsEditor.Point` inside the point. They were dropped, so a point whose look came from its children rendered as nothing.

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

- [#260](https://github.com/m1m0zzz/tremolo-ui/pull/260) [`32a4abf`](https://github.com/m1m0zzz/tremolo-ui/commit/32a4abf7ad406ad1fc043ee760c14b09ba7a26a3) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `PointsEditor.SelectionBox`, the box a drag on empty space draws. It takes `className`, `style`, `children` and the rest of a div like every other part, and the container no longer draws one of its own — place it inside `PointsEditor.Container` to keep the box.

- [#242](https://github.com/m1m0zzz/tremolo-ui/pull/242) [`5f8cb13`](https://github.com/m1m0zzz/tremolo-ui/commit/5f8cb139fb71b366cc91261c717c5a27c3c0b57d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Keep the `useAnimationFrame` loop running across renders when the callback is written inline. The callback is now read through a ref, so only the `deps` given to the hook restart the loop — an inline callback that renders no longer cancels and re-schedules its own loop on every frame.

- [#223](https://github.com/m1m0zzz/tremolo-ui/pull/223) [`a89106e`](https://github.com/m1m0zzz/tremolo-ui/commit/a89106ed360301eb6f2ee8af9c1713bfd7e03b26) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Expose the x and y values of XYPad thumbs and PointsEditor points as separate visually hidden range inputs with configurable accessible names, and group the two XYPad axes.

- [#271](https://github.com/m1m0zzz/tremolo-ui/pull/271) [`b3cf7e4`](https://github.com/m1m0zzz/tremolo-ui/commit/b3cf7e42fd0cb9ee105b00c8f71a316f5e2cd125) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Stop shipping class names. A part carries what you pass to `className` and nothing else — the `tremolo-` classes are gone, and with them the stylesheet that could reach in without being asked. Styling is now: give every part a class of your own, read the state from the `data-` attributes, and copy the theme from the documentation as a starting point. `Knob.Thumb` loses `classes.thumb`, which named the same element as its `className`.

- [#253](https://github.com/m1m0zzz/tremolo-ui/pull/253) [`b18e938`](https://github.com/m1m0zzz/tremolo-ui/commit/b18e93848479c7aee9afc00cf23f7da372ce2c79) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Keep the focus inside `Slider` and `PointsEditor.Point` after a press. Neither the track, the thumb nor the point could hold focus, so the browser cleared it to the body and undid the focus the drag had just given the hidden input — leaving the arrow keys dead until the control was tabbed to. Both now take the focus themselves and pass it on to the input.

- [#252](https://github.com/m1m0zzz/tremolo-ui/pull/252) [`5142435`](https://github.com/m1m0zzz/tremolo-ui/commit/5142435a23b1dc87d7a60a44ba5d46c36bf8dba1) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Move both axes of `XYPad` and `PointsEditor.Point` with the arrow keys, whichever of the two range inputs holds the focus. The axis used to be read off the focused input, and since the focus lands on the x input, the up and down keys did nothing.

- [#164](https://github.com/m1m0zzz/tremolo-ui/pull/164) [`a6dbfee`](https://github.com/m1m0zzz/tremolo-ui/commit/a6dbfeecb046d4dc8130e1438ee45b585d051233) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `@tremolo-ui/react/styles/global.css` is removed, along with the
  `.tremolo-user-select-none` and `.tremolo-cursor-*` classes it held.
  
  Nothing has to be done to keep the same behaviour: the page-wide
  `user-select: none` a drag applies is now an inline style set by the component,
  so it works without any stylesheet. The `.tremolo-cursor-*` classes had already
  stopped being used — a dragged element takes its cursor from `createDrag`.

- [#212](https://github.com/m1m0zzz/tremolo-ui/pull/212) [`8fd96fe`](https://github.com/m1m0zzz/tremolo-ui/commit/8fd96fe0c6badb8929ef4d97fb228cae757080d7) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Remove `externalStyles.userSelectNone` from Knob, Slider, XYPad, and PointsEditor. The React body-style guard duplicated drag selection handling in `@tremolo-ui/dom` and did not prevent iOS Safari's existing unfocused long-press selection. `externalStyles.cursor` now accepts every CSS cursor value.
  
  Export the shared keyboard, wheel, and drag defaults as `DEFAULT_KEYBOARD_OPTIONS`, `DEFAULT_WHEEL_OPTIONS`, and `DEFAULT_DRAG_SENSITIVITY`.

- [#239](https://github.com/m1m0zzz/tremolo-ui/pull/239) [`4c71ba8`](https://github.com/m1m0zzz/tremolo-ui/commit/4c71ba84ff95d98648bbb70af065de2e3804ab96) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Export `useKnobContext`, `useXYPadContext` and the Slider `MarksOptions` / `MarksType` types from the package root so every component exposes its context hook and related types consistently.

- [#264](https://github.com/m1m0zzz/tremolo-ui/pull/264) [`d43b890`](https://github.com/m1m0zzz/tremolo-ui/commit/d43b890139c9f9dee85c1878dabd661b2efa20cd) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Say a state by the attribute alone. Every `data-` state is now written only while it is on — `[data-disabled]`, `[data-dragging]`, `[data-selected]` and the rest, rather than `="true"` and `="false"` — and the wrappers that are not controls of their own carry `data-disabled` / `data-readonly` in place of the ARIA they had. The controls themselves (`Knob`, `NumberInput.InputField`, the steppers, the range inputs inside a thumb) keep their ARIA as well: that says what they are, while the `data-` attributes are what the styles read.

- [#255](https://github.com/m1m0zzz/tremolo-ui/pull/255) [`603d6af`](https://github.com/m1m0zzz/tremolo-ui/commit/603d6af8f01650eea329ea5fa4ef322f0ca2d27d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Hand the focus to the selection a rubber band leaves behind in `PointsEditor`. The press that starts the band takes the focus out of the editor, so a selection made that way could not be moved with the arrow keys or the wheel until one of its points was clicked again.

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

- [#227](https://github.com/m1m0zzz/tremolo-ui/pull/227) [`880d9c6`](https://github.com/m1m0zzz/tremolo-ui/commit/880d9c6e4ccedb12a90290da7e6d6563a4253eb7) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Draw 360-degree Knob active and inactive lines as multiple SVG arc segments so full-circle endpoints remain visible.

- [#207](https://github.com/m1m0zzz/tremolo-ui/pull/207) [`5f12a47`](https://github.com/m1m0zzz/tremolo-ui/commit/5f12a47117b3599350ac57a8fe216c726d4454bf) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - End every active drag when its instance is destroyed or its pointer capture is
  lost. These paths use the existing `onDragEnd` callback, as cleanup is required
  after every drag that started regardless of how the pointer stopped tracking.
  
  React controls now balance the page-wide `user-select: none` they acquire even
  when they unmount or become readonly during a drag.

- [#220](https://github.com/m1m0zzz/tremolo-ui/pull/220) [`b8276b4`](https://github.com/m1m0zzz/tremolo-ui/commit/b8276b437ca3e4c2dea3ac1d2c8458c7182a7eea) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Keep finite NumberInput values beyond JavaScript's safe-integer range when clamping is disabled or the corresponding range endpoint is not specified.

- [#178](https://github.com/m1m0zzz/tremolo-ui/pull/178) [`702d0a9`](https://github.com/m1m0zzz/tremolo-ui/commit/702d0a99e72d58bcb32f610a5e094810abaa299d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **Importing one component now brings only that component.** Tree shaking was
  not working at all: a build that used nothing but `Knob` still carried Piano,
  Slider, XYPad, NumberInput and PointsEditor. Bundled with esbuild, that came
  to 32,362 bytes against 39,113 for importing the whole package.
  
  The cause was `forwardRef(...)` and `createContext(...)` being plain
  module-level calls. A bundler has to assume a call might have side effects, so
  `const Knob = { Root: forwardRef(...) }` survives even when `Knob` is unused.
  Both are pure, and are now annotated as such.
  
  | import | before | after |
  | --- | --- | --- |
  | `Knob` | 32,362 | **11,567** |
  | `Slider` | — | 12,518 |
  | `NumberInput` | — | 10,498 |
  | `Piano` | — | 7,866 |
  | everything | 39,113 | 39,113 |
  
  `clsx` is no longer a dependency. Every call in the package was
  `clsx('tremolo-x', className)` — a constant name plus the caller's own — with
  no object, array or nesting anywhere, so it is a one-line function now.
  `@tremolo-ui/react` depends on nothing but `@tremolo-ui/dom` and
  `@tremolo-ui/functions`.
  
  `sideEffects` is `false` rather than `["*.css"]`, which pointed at files the
  package stopped shipping when the CSS was removed.

- [#149](https://github.com/m1m0zzz/tremolo-ui/pull/149) [`b664f35`](https://github.com/m1m0zzz/tremolo-ui/commit/b664f35d29b4bf1506c26a645b429afc60ccc5eb) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Warn in development when a subcomponent is rendered at the wrong level.
  
  Children are rendered exactly as they are composed, so `<Slider.Thumb />` left as a sibling of `<Slider.Track>` still renders — it just resolves its `position: absolute` against the page instead of the track, and neither the build nor the tests notice. React says nothing either, except for the SVG parts of `Knob`, where it reports an unrecognized `<path>` tag without saying which component was misplaced.
  
  Each of these now says so, naming the wrong parent when there is one:
  
  - `Slider.Thumb` outside `Slider.Track`, `Slider.MarksOption` outside `Slider.Marks`
  - `XYPad.Thumb` outside `XYPad.Area`
  - `Knob.ActiveLine` / `Knob.InactiveLine` / `Knob.Thumb` outside `Knob.SVGRoot`
  - `PointsEditor.Point` outside `PointsEditor.Container`
  
  It is a warning rather than an error, since the component does render, and the check is dropped from a production build.

- [#180](https://github.com/m1m0zzz/tremolo-ui/pull/180) [`6d80c25`](https://github.com/m1m0zzz/tremolo-ui/commit/6d80c25816ed2266a7f8cb25ddefbdeb63c0d950) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **A development build now says when a key press or a wheel notch cannot do
  anything visible.** Two settings that are each fine on their own can cancel
  out, and nothing fails when they do — the control just sits there.
  
  - `keyboard={['raw', 0.1]}` with `step={1}` rounds every press straight back
    to where it started
  - a `format` showing two decimals of a value in seconds cannot show a press
    worth one millisecond
  
  `Slider`, `Knob`, `XYPad` (per axis) and `NumberInput` press every entry of
  `keyboard` and `wheel` at nine points along their range and report what came
  of it. `format` is called rather than read, so an arbitrary function is no
  obstacle: what matters is whether its output changes, not how many digits it
  has.
  
  A display that merely rounds is left alone — that is a deliberate choice and
  usually the right one. Only a display too coarse to show a press *anywhere in
  the range* is reported. Production builds carry neither the check nor the
  messages.

- [#221](https://github.com/m1m0zzz/tremolo-ui/pull/221) [`a93d98f`](https://github.com/m1m0zzz/tremolo-ui/commit/a93d98fc1c4a27f7969c9d94bac0432146d4faf6) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Apply `reverse` to wheel input on horizontal Sliders as well as vertical ones, keeping wheel movement consistent with the visual and keyboard directions.

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

- [#230](https://github.com/m1m0zzz/tremolo-ui/pull/230) [`0718c20`](https://github.com/m1m0zzz/tremolo-ui/commit/0718c2005c7d9e67c24dae8f245269b51ff56194) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Preserve custom Knob thumb classes, keep Piano fill widths finite for ranges without white keys, and apply current dimensions when AnimationCanvas switches sizing modes.

- [#228](https://github.com/m1m0zzz/tremolo-ui/pull/228) [`83612df`](https://github.com/m1m0zzz/tremolo-ui/commit/83612df11ca74696b14d7bbcf77656f5aad7aa1e) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Make the disposer returned by useEventListener stable and ensure it removes the listener from the target used during registration.
- Updated dependencies [[`91f2486`](https://github.com/m1m0zzz/tremolo-ui/commit/91f24860cedde8f8286546741809a889576da360), [`5f12a47`](https://github.com/m1m0zzz/tremolo-ui/commit/5f12a47117b3599350ac57a8fe216c726d4454bf), [`9c5abb1`](https://github.com/m1m0zzz/tremolo-ui/commit/9c5abb1a69951a31968c50c3000297a8784a2949), [`ba7be4b`](https://github.com/m1m0zzz/tremolo-ui/commit/ba7be4b4d4ee46180d577c97f7dd38d5b7da3c45), [`fc5b383`](https://github.com/m1m0zzz/tremolo-ui/commit/fc5b383c7ca55e6ccd8a648962fedaa51daac422), [`afce3a3`](https://github.com/m1m0zzz/tremolo-ui/commit/afce3a3a89da61ca175f12a159dbd49b86c9c62d), [`eec3e53`](https://github.com/m1m0zzz/tremolo-ui/commit/eec3e53ab2c3b22e940e0fb9d73ee99c0d66fd8f), [`a712bc2`](https://github.com/m1m0zzz/tremolo-ui/commit/a712bc2a2eef095f00aa18f7ce398a89ee4d264a), [`d1dc65f`](https://github.com/m1m0zzz/tremolo-ui/commit/d1dc65f9165b77fdae5a23539be194d804002e4d), [`2ff5c1d`](https://github.com/m1m0zzz/tremolo-ui/commit/2ff5c1db221bf2be7c685ce8149da36d1084819d), [`0721aa2`](https://github.com/m1m0zzz/tremolo-ui/commit/0721aa296526cd37fd0d004e184993de16acabd4), [`041483e`](https://github.com/m1m0zzz/tremolo-ui/commit/041483e300a6848daf08e53b998342536053d335), [`30e927a`](https://github.com/m1m0zzz/tremolo-ui/commit/30e927ac00a7b058b6feecd5a4ea4cd42df58e86), [`e180798`](https://github.com/m1m0zzz/tremolo-ui/commit/e1807981b328c574df9d25facc94e9c7884e43ae), [`12d6463`](https://github.com/m1m0zzz/tremolo-ui/commit/12d6463974c0a98560e3022bef64f5f6f317b7b9), [`7ec27cc`](https://github.com/m1m0zzz/tremolo-ui/commit/7ec27cc43c97f4d01bb9f6a90557ee22dff5e018), [`e31065c`](https://github.com/m1m0zzz/tremolo-ui/commit/e31065c076d4e163539bd5c34165b1f5c16694dc), [`83fa74b`](https://github.com/m1m0zzz/tremolo-ui/commit/83fa74b9618ea0367a5e08453241e7a190db9b88), [`84cbcdb`](https://github.com/m1m0zzz/tremolo-ui/commit/84cbcdb477cf825ff2206ad447ad0e6cdfb1ab09), [`5ebb50e`](https://github.com/m1m0zzz/tremolo-ui/commit/5ebb50e458ece38eef60df5cfa750bd00a6ef9ef)]:
  - @tremolo-ui/dom@0.6.0
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

- [#143](https://github.com/m1m0zzz/tremolo-ui/pull/143) [`0d33294`](https://github.com/m1m0zzz/tremolo-ui/commit/0d3329440874258566bd72af5ada36e3ada5a51c) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Rename `Slider.Scale` to `Slider.Marks`
  
  **Breaking.** `scale` is now the prop that says how a value is distributed across the travel, so the subcomponent that draws the tick marks needed a name of its own — `<Slider.Root scale={…}><Slider.Scale/></Slider.Root>` read as though the two were related.
  
  ```diff
  -<Slider.Scale>
  -  <Slider.ScaleOption value={0} type="mark-number" />
  -</Slider.Scale>
  +<Slider.Marks>
  +  <Slider.MarksOption value={0} type="mark-number" />
  +</Slider.Marks>
  ```
  
  | before | after |
  | --- | --- |
  | `Slider.Scale` | `Slider.Marks` |
  | `Slider.ScaleOption` | `Slider.MarksOption` |
  | `ScaleProps` | `MarksProps` |
  | `ScaleOptionProps` | `MarksOptionProps` |
  | `ScaleOptions` | `MarksOptions` |
  | `ScaleType` | `MarksType` |
  | `.tremolo-slider-scale` | `.tremolo-slider-marks` |
  | `.tremolo-slider-scale-option` | `.tremolo-slider-marks-option` |
  | `.tremolo-slider-scale-option-mark` | `.tremolo-slider-marks-option-mark` |
  | `.tremolo-slider-scale-option-label` | `.tremolo-slider-marks-option-label` |
  
  The `options` prop and its behaviour are unchanged, and `@tremolo-ui/react/styles/Slider.css` still exports the same file.

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

- [#138](https://github.com/m1m0zzz/tremolo-ui/pull/138) [`0e95f89`](https://github.com/m1m0zzz/tremolo-ui/commit/0e95f890d276f1164bcbf8f7f77a8e618d94c0cb) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Unify `Slider`, `Knob` and `XYPad` on one implementation.
  
  The three had diverged in how they treated `children`, and that decided where `value` lived. `Slider` and `XYPad` harvested props off their children and re-rendered their own markup, so the value could be passed down as props; `Knob` rendered children as written, so it had to keep the value in a store. All three now render children as written and read from a context that is derived during render, so there is no state to keep in sync.
  
  Breaking: `children` is required. There is no default markup to fall back to, so adding one child no longer makes the rest disappear.
  
  ```jsx
  <Slider.Root value={value} min={0} max={100} onChange={setValue}>
    <Slider.Track>
      <Slider.Thumb />
    </Slider.Track>
  </Slider.Root>
  ```
  
  Breaking: `Slider.Thumb` goes inside `Slider.Track`, and `XYPad.Thumb` inside `XYPad.Area`, rather than being siblings.
  
  Breaking: `XYPad` takes per-axis settings as `[x, y]` tuples mirroring `Slider`, instead of `x` and `y` option objects. A plain value applies to both axes. `onChange`, `onDragStart` and `onDragEnd` now receive a single `[x, y]` tuple. Per-axis `wheel` and `keyboard` options are gone; the pad takes one of each.
  
  ```jsx
  <XYPad.Root value={[x, y]} min={0} max={100} onChange={([x, y]) => ...}>
    <XYPad.Area>
      <XYPad.Thumb />
    </XYPad.Area>
  </XYPad.Root>
  ```
  
  Breaking: `size`, `width` and `height` are gone from `Slider.Thumb` and `XYPad.Thumb`. The thumb size is the `--thumb-size` CSS variable on the root, which is also what the root uses to reserve space around the track or area, so the two can no longer disagree.
  
  `Slider.Track` and `XYPad.Area` now accept a `ref`, composed with the one the root needs for normalizing the pointer position.

- [#135](https://github.com/m1m0zzz/tremolo-ui/pull/135) [`99d5db0`](https://github.com/m1m0zzz/tremolo-ui/commit/99d5db0fb5849f1f23bab7a800191b027b52feea) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Fix the Knob arcs overflowing their viewBox. The active and inactive lines were drawn at the full radius, so half of the stroke fell outside the `viewBox` and was rescued with `overflow: visible`. The radius is now inset by half the stroke width, and the `overflow: visible` rules are gone.
  
  Removed the unused `block` and `overflowVisible` props from `Knob.SVGRoot`. `block` was declared but never read, so passing it forwarded an invalid attribute to the `<svg>` element.

- [#138](https://github.com/m1m0zzz/tremolo-ui/pull/138) [`0e95f89`](https://github.com/m1m0zzz/tremolo-ui/commit/0e95f890d276f1164bcbf8f7f77a8e618d94c0cb) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Give `Knob` a default size. Without the `size` prop the element collapsed to nothing, because `width` and `height` were set to `undefined` and the SVG inside has no intrinsic size. The default now lives in the CSS as `--knob-size` (50px) and `size` still overrides it.

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

- [#147](https://github.com/m1m0zzz/tremolo-ui/pull/147) [`2f3bc8a`](https://github.com/m1m0zzz/tremolo-ui/commit/2f3bc8a4e8fe8b7f6be78e2c994cd34754fc7e89) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Rebuild `PointsEditor` on plain React context, and make its `wheel` / `keyboard` props do something. `zustand` is gone from the dependencies of `@tremolo-ui/react` with it.
  
  `PointsEditor` was the last component keeping its settings in a zustand store. Everything in that store was derived from the props of `Root`, so it is now a plain context like `Slider` and `XYPad` have. Three bugs went with it:
  
  - `<PointsEditor.Root readonly>` did nothing. `Point` read `readonly` from the context for its ARIA attribute, but guarded the drag with its own prop only, so the points still moved. `readonly` and `disabled` now reach every `Point`, and a `Point` can still override either
  - `wheel` and `keyboard` were declared, typed and documented on `Root`, but nothing was ever wired to them. The arrow keys now nudge the focused point (y grows downwards, so ArrowUp moves it up) and the wheel moves it while it has focus, with shift selecting the x axis — the same conventions as `XYPad`. `Root` sets the default and a `Point` can override it, `null` turning the input off
  
    Unlike a slider, an editor has several movable points, so the wheel listens on the container rather than on each point: a wheel event only reaches what the cursor is over, and a point is a 16px target. Every point sees the event and the focused one acts, so the wheel works anywhere over the editor. While a point has focus the editor takes the scroll, as `Slider` and `XYPad` already do
  - `Container` called into the store while rendering, replacing the container element on every mount. It now composes the context ref with whatever ref you pass, so `<PointsEditor.Container ref={...} />` works
  
  Breaking changes:
  
  - `PointsEditorProps.grid` is removed. It was never implemented and leaked onto the DOM as a `grid` attribute
  - `PointsEditorProps.children` is now required, matching the other components
  - `usePointsEditorContext` no longer requires a selector; calls that pass one are unaffected
  - A readonly point no longer shows a `grab` cursor, since dragging it does nothing
  
  `useWheel` gained a `target` option for this, listening on an element that is managed elsewhere instead of on the one its ref callback is attached to.

### Patch Changes

- [#137](https://github.com/m1m0zzz/tremolo-ui/pull/137) [`68f05cb`](https://github.com/m1m0zzz/tremolo-ui/commit/68f05cb7d8fbe896da47915837882ad08cb5ad95) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Fix a slow drag not registering. Movement below `createDrag`'s threshold was discarded instead of carried over, and pointer coordinates are fractional, so dragging slowly moved less than a pixel per event and never reported anything. It now accumulates until it crosses the threshold.
  
  The threshold also now defaults to 0 in `createDrag`, which restores `useDragWithElement` (used by `Slider`, `XYPad` and `PointsEditor`) to having no threshold at all, as it did before the move to `@tremolo-ui/dom`. `useDrag` still defaults to 1.
- Updated dependencies [[`954dc53`](https://github.com/m1m0zzz/tremolo-ui/commit/954dc534f438b9869f92a48bf4199b3db3b84432), [`27209dc`](https://github.com/m1m0zzz/tremolo-ui/commit/27209dc9fd1dc311b689fc36760a25d01c0c1990), [`68f05cb`](https://github.com/m1m0zzz/tremolo-ui/commit/68f05cb7d8fbe896da47915837882ad08cb5ad95), [`0646236`](https://github.com/m1m0zzz/tremolo-ui/commit/064623612fdbf55366da96773dfa535ff0e63a77), [`fe74061`](https://github.com/m1m0zzz/tremolo-ui/commit/fe74061f7e746a958ebe82aeb5a3aa8bad72407b), [`95df589`](https://github.com/m1m0zzz/tremolo-ui/commit/95df589c481b536bf9bab428692b6265fcf0d557)]:
  - @tremolo-ui/dom@0.5.0
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

### Patch Changes

- Updated dependencies [[`c0bda83`](https://github.com/m1m0zzz/tremolo-ui/commit/c0bda8399f2ba686b9ce2144dd4341b26ae0eb34)]:
  - @tremolo-ui/dom@0.4.0
  - @tremolo-ui/functions@0.4.0

## 0.3.0

### Minor Changes

- [`2a40e1c`](https://github.com/m1m0zzz/tremolo-ui/commit/2a40e1c50c57c44a2bdbd7d67310488f66d4b9c1) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `@tremolo-ui/dom`, a framework-agnostic DOM layer, and move the Web MIDI logic into it as `createMIDIAccess` / `createMIDIMessage` / `createMIDIInput`.
  
  `useMIDIAccess`, `useMIDIMessage` and `useMIDIInput` keep the same signatures and now call the core internally.

### Patch Changes

- Updated dependencies [[`2a40e1c`](https://github.com/m1m0zzz/tremolo-ui/commit/2a40e1c50c57c44a2bdbd7d67310488f66d4b9c1)]:
  - @tremolo-ui/dom@0.3.0
  - @tremolo-ui/functions@0.3.0

## 0.2.1

### Patch Changes

- [`e8f4e6e`](https://github.com/m1m0zzz/tremolo-ui/commit/e8f4e6ea6de41d48a2f9e4611813ec7cb0cc202d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Fix the `@tremolo-ui/functions` dependency range, which was left at `^0.1.6` while the package was released as 0.2.0.
- Updated dependencies []:
  - @tremolo-ui/functions@0.2.1
