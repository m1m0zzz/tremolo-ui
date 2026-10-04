# @tremolo-ui/vue

## 0.9.0

### Minor Changes

- [#403](https://github.com/m1m0zzz/tremolo-ui/pull/403) [`1001907`](https://github.com/m1m0zzz/tremolo-ui/commit/1001907b2f9cfda1dc78dd1878f82ee25fb7ffa3) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Report when a change of value starts and ends, whatever makes it, for hosts
  that record automation and need to know when a control is touched.
  
  `Knob`, `Slider` and `XYPad` take `onChangeStart(value, source)` and
  `onChangeEnd(value, source)` (`change-start` / `change-end` in Vue). The start
  gets the value before the change, the end the value it ended on, and `source`
  says what made it: `'pointer'`, `'wheel'`, `'keyboard'` or `'doubleClick'`.
  
  - A drag starts on the press and ends on release
  - The wheel and the arrow keys have no end of their own, so the change ends
    `changeEndDelay` (default 500 ms) after the last notch or key press
  - A double click on `Knob` that resets the value starts and ends around it
  
  These replace `onDragStart` / `onDragEnd` on `Slider` and `XYPad`
  (`drag-start` / `drag-end` in Vue): a drag is now one of the sources. To keep
  reacting to drags only, check `source === 'pointer'`.
  
  The tracking lives in `@tremolo-ui/dom` as `createChangeGesture`, with the
  `ChangeSource` type. `createDragValue` now calls `onDragStart` before the
  `onChange` of the press with `updateOnPointerDown`, so that a drag is reported
  as started before its first value.

- [#398](https://github.com/m1m0zzz/tremolo-ui/pull/398) [`5988052`](https://github.com/m1m0zzz/tremolo-ui/commit/5988052b88216a9a11595e0d7c93f0e5b864fa2f) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Name the props that take a colour `*Color`, after `color` on `Slider.Thumb`
  and `XYPad.Thumb`.
  
  `Knob.Thumb` drops the `thumb` prefix from all its props, which only repeated
  the part's name:
  
  - `thumb` → `color`, `thumbLine` → `lineColor`
  - `thumbSize` → `size`, `thumbLineWeight` → `lineWeight`,
    `thumbLineLength` → `lineLength`
  - `classes.thumbLine` → `classes.line`
  
  `Slider.Track` takes `activeColor` / `inactiveColor` instead of `active` /
  `inactive`, and the custom properties they write are renamed to match:
  `--active` → `--active-color`, `--inactive` → `--inactive-color`. A theme that
  reads or sets the old names on the track needs the new ones; the demo theme in
  the docs is updated.
  
  `Knob.ActiveLine` / `InactiveLine` keep `stroke` and `strokeWidth`, which go
  straight onto the SVG attributes of the same names.

- [#406](https://github.com/m1m0zzz/tremolo-ui/pull/406) [`c9df5f4`](https://github.com/m1m0zzz/tremolo-ui/commit/c9df5f4e461bfb3244ece5ede42c7cb76351ff10) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Split `@tremolo-ui/dom` into two entries before 1.0, when everything in the
  main one comes under semver.
  
  The main entry keeps what users of the components and of this package write:
  the `create*` interactions, the values and types that appear in props (the
  default input options, `SHORTCUTS`, the mappings, `XY` and so on), and the
  geometry a part of your own needs to draw (`KNOB_VIEWBOX_SIZE`, `knobArcPath`,
  `knobArcRadius`, `knobAngles`, `valuePercent`, `notePosition`).
  
  What only the wrappers use moves to `@tremolo-ui/dom/internal`, which is not
  covered by semver: the number input's text and draft handling
  (`parseNumberText`, `numberSpan`, `commitNumberInputText`,
  `nudgeNumberInput`, ...), `createStepperDrag`, the key and wheel direction
  helpers, `applyDelta` and `selectModifier`, the piano layout apart from
  `notePosition`, `clampPoint` / `POINT_AXIS` / `POINTS_EDITOR_DEFAULT_*`,
  `sliderMarks`, `partitionByAccept`, `replaceOptions`, `checkSteps`,
  `cssLength`, `visuallyHiddenStyle` and `toXY`.
  
  The wrappers now depend on `@tremolo-ui/dom` at the exact version rather than
  a caret range, since they use the internal entry.

- [#397](https://github.com/m1m0zzz/tremolo-ui/pull/397) [`885853f`](https://github.com/m1m0zzz/tremolo-ui/commit/885853f7a53c0c82b4dd06a63533b65321ccb24d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Replace `externalStyles: { cursor }` with a `dragCursor` string on `Knob`,
  `Slider`, `XYPad` and `PointsEditor`. The object only ever held the cursor
  shown while dragging. The defaults stay as they were: `'grabbing'` for `Knob`
  and the points of `PointsEditor`, `'pointer'` for `Slider` and `XYPad`.
  
  - `externalStyles={{ cursor: 'move' }}` → `dragCursor="move"`
  
  `NumberInput` takes a `dragCursor` too, for dragging a `Stepper`, where the
  cursor was fixed to `'ns-resize'`. `createStepperDrag` in `@tremolo-ui/dom`
  takes the matching `cursor` option.
  
  The `PointsEditor` context carries it as `dragCursor`, in place of
  `externalStyles` in React and `cursor` in Svelte and Vue.

- [#393](https://github.com/m1m0zzz/tremolo-ui/pull/393) [`9c74838`](https://github.com/m1m0zzz/tremolo-ui/commit/9c748381ede5a3f0c902e8d7167a17040b482725) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Remove the `DrawFunction` and `InitFunction` types from the wrappers. They were
  other names for `CanvasDrawFunction` and `CanvasInitFunction` in
  `@tremolo-ui/dom`, which `AnimationCanvas` now takes directly: import those
  instead.
  
  The Svelte and Vue `AnimationCanvas` no longer say that `init` runs again after
  a resize. It never did: it runs once, before the first frame.

- [#396](https://github.com/m1m0zzz/tremolo-ui/pull/396) [`1bcd0b1`](https://github.com/m1m0zzz/tremolo-ui/commit/1bcd0b10c2dac9b3f756e75bab288dce4301a658) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Replace `Knob`'s `defaultValue` and `enableDoubleClickDefault` with one
  `resetValue?: number | null`. It is the value a double click restores, and
  `null` turns the double click off, as `null` does for `wheel` and `keyboard`.
  `default*` reads as the starting value of an uncontrolled control, which this
  never was.
  
  The value restored by default is now `startValue` rather than `min`, so a
  bipolar knob such as a pan returns to its centre without saying so twice.
  `startValue` itself still defaults to `min`.
  
  - `defaultValue={v}` → `resetValue={v}`
  - `enableDoubleClickDefault={false}` → `resetValue={null}`

- [#404](https://github.com/m1m0zzz/tremolo-ui/pull/404) [`92f4bf1`](https://github.com/m1m0zzz/tremolo-ui/commit/92f4bf10735b9b5edf7189ac6b56d90a2f39abf2) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `NumberInput` reports when a change of its value starts and ends, like `Knob`,
  `Slider` and `XYPad`: `onChangeStart(value, source)` / `onChangeEnd(value,
  source)` (`change-start` / `change-end` in Vue), with `changeEndDelay`.
  
  - A press on a stepper is one change from the press to the release, wherever
    the pointer ends up: the first step, the repeats while it is held, and a drag
    on the stepper all belong to it
  - Typing starts a keyboard change with the first character that changes the
    value, and committing the text ends it
  - The wheel and the arrow keys end `changeEndDelay` after the last notch or key
    press

- [#405](https://github.com/m1m0zzz/tremolo-ui/pull/405) [`3126d10`](https://github.com/m1m0zzz/tremolo-ui/commit/3126d10c7dae76582bcf16fec31e964ccf9688d5) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `PointsEditor.Point` reports when a change of it starts and ends, like the
  other controls, in place of `onDragStart` / `onDragEnd` (`drag-start` /
  `drag-end` in Vue): `onChangeStart(value, source)` / `onChangeEnd(value,
  source)` (`change-start` / `change-end`), with `changeEndDelay`. A drag, the
  wheel while the point has the focus, and the arrow keys all count.
  
  The change belongs to the point being operated: the points that move along
  with a selection report through `onChange` only, as they did before.
  
  `PointsEditorPoint` in `@tremolo-ui/dom` takes an optional `beforeWheel`, which
  `nudgeFocusedPoint` calls just before the wheel moves the point.

- [#399](https://github.com/m1m0zzz/tremolo-ui/pull/399) [`e076f9d`](https://github.com/m1m0zzz/tremolo-ui/commit/e076f9d6059f154bc878443f5eb73ed6565b29ff) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Replace `Slider`'s `vertical` boolean with
  `orientation: 'horizontal' | 'vertical'`, the same values the parts already
  carry as `data-orientation` (as in Radix and Base UI).
  
  - `vertical` → `orientation="vertical"`
  
  The slider context exposes `orientation` in place of `vertical` too, for parts
  of your own that read it.

- [#401](https://github.com/m1m0zzz/tremolo-ui/pull/401) [`e42f1ba`](https://github.com/m1m0zzz/tremolo-ui/commit/e42f1bab74aa096244b82ae699ed8de209d1cc63) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Export the props types of the components, under the same names as React and
  Svelte: `AnimationCanvasProps`, `DropZoneProps`, `FileInputProps`,
  `KnobProps`, `KnobThumbProps`, `NumberInputProps`, `PianoProps`,
  `PointsEditorProps`, `PointsEditorPointProps`, `SliderProps`,
  `SliderMarksProps`, `SliderMarksOptionProps`, `SliderThumbProps`,
  `SliderTrackProps`, `XYPadProps` and `XYPadThumbProps`. Each is the public
  props of the component as Vue sees them, required props included, so a wrapper
  of your own can take and pass them on.

- [#394](https://github.com/m1m0zzz/tremolo-ui/pull/394) [`d623e55`](https://github.com/m1m0zzz/tremolo-ui/commit/d623e55ef75b396dfec85391e86574d92a21a44b) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `createWheel` takes its handler as a required `onWheel` option, like
  `createLongPress` takes `onPress`: `createWheel(element, { onWheel, requireFocus })`
  instead of `createWheel(element, onWheel, { requireFocus })`. The handler was
  given twice before, once as an argument and once as an option for `update()`.
  
  The Svelte `wheel` action takes those same options, so `WheelActionOptions` is
  gone; the object passed to `use:wheel` does not change.
  
  The Vue `useWheel` no longer accepts `onWheel` among its options. Passing one
  replaced the handler given as the second argument on the next update, and
  taking it out again left no handler at all.

### Patch Changes

- Updated dependencies [[`1001907`](https://github.com/m1m0zzz/tremolo-ui/commit/1001907b2f9cfda1dc78dd1878f82ee25fb7ffa3), [`ecabb23`](https://github.com/m1m0zzz/tremolo-ui/commit/ecabb23ff3cacea5beceb93cc4bcea44ae97cd95), [`c9df5f4`](https://github.com/m1m0zzz/tremolo-ui/commit/c9df5f4e461bfb3244ece5ede42c7cb76351ff10), [`885853f`](https://github.com/m1m0zzz/tremolo-ui/commit/885853f7a53c0c82b4dd06a63533b65321ccb24d), [`62a07a4`](https://github.com/m1m0zzz/tremolo-ui/commit/62a07a48d08e8b12d884517f2d5321008df05c7d), [`3126d10`](https://github.com/m1m0zzz/tremolo-ui/commit/3126d10c7dae76582bcf16fec31e964ccf9688d5), [`d623e55`](https://github.com/m1m0zzz/tremolo-ui/commit/d623e55ef75b396dfec85391e86574d92a21a44b)]:
  - @tremolo-ui/dom@0.9.0
  - @tremolo-ui/functions@0.9.0

## 0.8.0

### Minor Changes

- [#360](https://github.com/m1m0zzz/tremolo-ui/pull/360) [`221b3ef`](https://github.com/m1m0zzz/tremolo-ui/commit/221b3efa6f25722f32243cc7038feef1043708dd) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Treat everything in a number input's text that is not the unit as the number.
  `selectOnFocus="number"` and `keepCaretOnStep` now cover a signed number
  (`+6.0 dB`, `−6.0 dB`), an exponent (`1e+21`) and a number after a unit
  (`L 30`), where they used to select nothing or stop part way.
  
  The default `parse` reads the same number, and gives `NaN`, which leaves the
  value alone, for one it cannot read whole instead of the digits in front:
  `1,000 Hz` and `1:30` no longer commit 1, and a number with a unit in front is
  left to a `parse` of your own.

- [#356](https://github.com/m1m0zzz/tremolo-ui/pull/356) [`3e106c2`](https://github.com/m1m0zzz/tremolo-ui/commit/3e106c24da4e0fdb16c36c9256a00a236fcf02aa) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `AnimationCanvas`, `FileInput` (`FileInput`, `FileInputTrigger`) and
  `DropZone` to `@tremolo-ui/vue`. With these, every component of
  `@tremolo-ui/react` has a Vue counterpart.

- [#352](https://github.com/m1m0zzz/tremolo-ui/pull/352) [`5e0898a`](https://github.com/m1m0zzz/tremolo-ui/commit/5e0898a68f73d1f8a66a248440bada69ed72b466) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `Knob` to `@tremolo-ui/vue`: `Knob`, `KnobSVGRoot`, `KnobInactiveLine`,
  `KnobActiveLine` and `KnobThumb`, bound with `v-model`.

- [#354](https://github.com/m1m0zzz/tremolo-ui/pull/354) [`d1d7eb1`](https://github.com/m1m0zzz/tremolo-ui/commit/d1d7eb16fe3f959bff0b454e721c0f1d494d26bc) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `NumberInput` to `@tremolo-ui/vue`: `NumberInput`, `NumberInputField`,
  `NumberInputStepper`, `NumberInputIncrementStepper` and
  `NumberInputDecrementStepper`.

- [#351](https://github.com/m1m0zzz/tremolo-ui/pull/351) [`d109dac`](https://github.com/m1m0zzz/tremolo-ui/commit/d109dac7102f98ddffdc7190c9deaba224127bf1) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `@tremolo-ui/vue`, the Vue 3 wrapper. This first release carries the
  composables — `useDrag`, `useDragValue`, `useWheel`, `useLongPress`,
  `useDropZone`, `useMIDIAccess`, `useMIDIInput` and `useMIDIMessage`.

- [#355](https://github.com/m1m0zzz/tremolo-ui/pull/355) [`ccc6818`](https://github.com/m1m0zzz/tremolo-ui/commit/ccc6818c19e19f21efa3127084ab9da01dbb2297) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `Piano` (with a `label` slot and `playNote` / `stopNote` exposed) and
  `PointsEditor` (`PointsEditor`, `PointsEditorBackground`,
  `PointsEditorContainer`, `PointsEditorPoint`, `PointsEditorSelectionBox`,
  with `v-model:selection`) to `@tremolo-ui/vue`.

- [#353](https://github.com/m1m0zzz/tremolo-ui/pull/353) [`59299d2`](https://github.com/m1m0zzz/tremolo-ui/commit/59299d28ef618dcf48a176173ddd5bcd4176eb77) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `Slider` (`Slider`, `SliderTrack`, `SliderThumb`, `SliderMarks`,
  `SliderMarksOption`) and `XYPad` (`XYPad`, `XYPadArea`, `XYPadThumb`) to
  `@tremolo-ui/vue`.

### Patch Changes

- [#362](https://github.com/m1m0zzz/tremolo-ui/pull/362) [`eaeeb6f`](https://github.com/m1m0zzz/tremolo-ui/commit/eaeeb6f5ae404fdc3dd4337359446848b71e7b9c) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `FileInput` and `DropZone` report the rejected files after the accepted ones
  for the same selection or drop. A list of rejected files cleared in
  `onChange` / `onDrop` and filled in `onReject` now shows what a mixed
  selection left out, where it used to be cleared straight away.
- Updated dependencies [[`4a7b743`](https://github.com/m1m0zzz/tremolo-ui/commit/4a7b743cc5f0f17ae851ea56f0616ea3c92f4793), [`63d750f`](https://github.com/m1m0zzz/tremolo-ui/commit/63d750fe331756ee733a39a8fef029f61f3e8790), [`a3bb088`](https://github.com/m1m0zzz/tremolo-ui/commit/a3bb08865ab21f37f08b64d025519421778b395f), [`8309125`](https://github.com/m1m0zzz/tremolo-ui/commit/8309125b79d36073721d1d93f9c0d15e48692268), [`221b3ef`](https://github.com/m1m0zzz/tremolo-ui/commit/221b3efa6f25722f32243cc7038feef1043708dd), [`6a1710f`](https://github.com/m1m0zzz/tremolo-ui/commit/6a1710fc41b5e6c48dd1c8751f43bcb54ec2494b), [`b7dec12`](https://github.com/m1m0zzz/tremolo-ui/commit/b7dec12a1c9674c55617fbaaac4a2122b2ca83e2), [`eaeeb6f`](https://github.com/m1m0zzz/tremolo-ui/commit/eaeeb6f5ae404fdc3dd4337359446848b71e7b9c), [`479f29e`](https://github.com/m1m0zzz/tremolo-ui/commit/479f29ec2a651bc01c4f0fcd03cd90abb6402453)]:
  - @tremolo-ui/dom@0.8.0
  - @tremolo-ui/functions@0.8.0
