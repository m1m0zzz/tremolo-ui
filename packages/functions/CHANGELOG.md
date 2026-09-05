# @tremolo-ui/functions

## 0.5.1

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
