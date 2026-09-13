# @tremolo-ui/functions

## 0.6.0

### Minor Changes

- [#214](https://github.com/m1m0zzz/tremolo-ui/pull/214) [`fc5b383`](https://github.com/m1m0zzz/tremolo-ui/commit/fc5b383c7ca55e6ccd8a648962fedaa51daac422) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - 数値・音名・Piano geometry の境界条件を検証し、不正値や極端な有限値にも一貫した結果を返すよう修正します。`InputEventOptions` 型エイリアスを削除し、`ModifierValue<InputEventOption>` に統一します。

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

- [#170](https://github.com/m1m0zzz/tremolo-ui/pull/170) [`d1dc65f`](https://github.com/m1m0zzz/tremolo-ui/commit/d1dc65f9165b77fdae5a23539be194d804002e4d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `wheel` and `keyboard` amounts can now name a modifier key.
  
  ```tsx
  keyboard={{ default: ['raw', 1], shift: ['raw', 0.1] }}
  ```
  
  `InputEventOptions` accepts either the old tuple or a map with a `default` and
  any of `shift` / `alt` / `ctrl` / `meta`. `selectInputEvent` resolves one
  against an event, and `applyDelta` takes the event as a fifth argument.
  
  **A modifier entry is not snapped to `step`.** Naming one is a deliberate
  request to move off the grid, and without the carve-out a finer amount would
  round straight back to where it started.

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

- [#216](https://github.com/m1m0zzz/tremolo-ui/pull/216) [`e31065c`](https://github.com/m1m0zzz/tremolo-ui/commit/e31065c076d4e163539bd5c34165b1f5c16694dc) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - 使用されていなかった `isEmpty` を公開 API と実装から削除します。

- [#190](https://github.com/m1m0zzz/tremolo-ui/pull/190) [`83fa74b`](https://github.com/m1m0zzz/tremolo-ui/commit/83fa74b9618ea0367a5e08453241e7a190db9b88) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - **`styleHelper` is removed.** It turned a number into a pixel length, with an
  optional bit of arithmetic — `styleHelper(10, '/', 2)` giving `'5px'`.
  
  Nothing uses it any more. Its one caller was the border radius of
  `Slider.Track`, which is `calc(var(--thickness) / 2)` in CSS now that the track
  no longer paints itself from JavaScript.
  
  Both of its cases are a line of their own:
  
  ```js
  typeof value === 'number' ? `${value}px` : value
  `calc(${value} / 2)`
  ```
  
  It also got the string case wrong — `styleHelper('2rem', '/', 2)` returned
  `calc(2rempx / 2)` — which is one more reason not to keep it.

- [#156](https://github.com/m1m0zzz/tremolo-ui/pull/156) [`84cbcdb`](https://github.com/m1m0zzz/tremolo-ui/commit/84cbcdb477cf825ff2206ad447ad0e6cdfb1ab09) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `unitFormat`, which builds the `format` and `parse` pair of a unit.
  
  ```tsx
  <NumberInput.Root {...unitFormat('Hz', { digits: 2 })} value={v} onChange={setV}>
  ```
  
  It picks an SI prefix by magnitude (`1234` reads `1.23kHz`), takes a `base`
  option for values that are already stored in a prefixed unit (milliseconds are
  `unitFormat('s', { base: 'm' })`), and can be told to add no prefix at all with
  `prefixes: false`, for dB, %, cents and the like.

### Patch Changes

- [#203](https://github.com/m1m0zzz/tremolo-ui/pull/203) [`041483e`](https://github.com/m1m0zzz/tremolo-ui/commit/041483e300a6848daf08e53b998342536053d335) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Fix `stepValue()` rounding a value to the wrong step.
  
  Two cases were wrong. A step small enough that JavaScript prints it in
  exponential notation — anything under `1e-6` — has no decimal part to read a
  digit count from, and the result was rounded to a whole number instead: a
  control with `step={1e-7}` snapped every value below half a step to `0`. And a
  value sitting exactly on a half step went up or down depending on where the
  error of the division happened to fall, so `0.25` rounded up to `0.3` while
  `0.15` and `0.35` rounded down.
  
  Both came from deciding the step by comparing the distance to the two
  neighbouring grid points, each computed with its own rounding. The quotient is
  now rounded directly, after its artefact is cleared, and a half step always
  goes up.

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

## 0.5.0

### Minor Changes

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

## 0.4.0

## 0.3.0

## 0.2.1
