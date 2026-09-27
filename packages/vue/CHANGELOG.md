# @tremolo-ui/vue

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
