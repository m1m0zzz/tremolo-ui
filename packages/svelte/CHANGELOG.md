# @tremolo-ui/svelte

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

- [#348](https://github.com/m1m0zzz/tremolo-ui/pull/348) [`5d68cff`](https://github.com/m1m0zzz/tremolo-ui/commit/5d68cffccb9e573591e6cc718814e22bd39b7f90) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `AnimationCanvas`, `FileInput` (`FileInput.Root`, `FileInput.Trigger`)
  and `DropZone` (`DropZone.Root`) to `@tremolo-ui/svelte`. With these, every
  component of `@tremolo-ui/react` has a Svelte counterpart.

- [#341](https://github.com/m1m0zzz/tremolo-ui/pull/341) [`0d8abee`](https://github.com/m1m0zzz/tremolo-ui/commit/0d8abee96e5cfdb94c0eccefef90da4d6b5e5632) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `Knob` to `@tremolo-ui/svelte`: `Knob.Root`, `Knob.SVGRoot`,
  `Knob.InactiveLine`, `Knob.ActiveLine` and `Knob.Thumb`, with the same parts,
  `data-*` attributes and demo theme as the React one. The value can be bound
  with `bind:value`.

- [#345](https://github.com/m1m0zzz/tremolo-ui/pull/345) [`40da2c2`](https://github.com/m1m0zzz/tremolo-ui/commit/40da2c2c2f06d6277e00316704f5efe65ff8ebf4) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `NumberInput` to `@tremolo-ui/svelte`: `NumberInput.Root`,
  `NumberInput.InputField`, `NumberInput.Stepper`,
  `NumberInput.IncrementStepper` and `NumberInput.DecrementStepper`.

- [#340](https://github.com/m1m0zzz/tremolo-ui/pull/340) [`63d750f`](https://github.com/m1m0zzz/tremolo-ui/commit/63d750fe331756ee733a39a8fef029f61f3e8790) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `@tremolo-ui/svelte`, the Svelte 5 wrapper. This first release carries
  the actions — `drag`, `dragValue`, `wheel`, `longPress` and `dropZone` — and
  the MIDI helpers `useMIDIAccess`, `useMIDIInput` and `useMIDIMessage`.

- [#346](https://github.com/m1m0zzz/tremolo-ui/pull/346) [`479f29e`](https://github.com/m1m0zzz/tremolo-ui/commit/479f29ec2a651bc01c4f0fcd03cd90abb6402453) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `Piano` to `@tremolo-ui/svelte`, with `playNote` / `stopNote` on the
  component and `label` as a snippet. `@tremolo-ui/dom` gains
  `fitWhiteKeyWidth`, the key width a `resizable` piano fills its container
  with.

- [#347](https://github.com/m1m0zzz/tremolo-ui/pull/347) [`5ef3cf8`](https://github.com/m1m0zzz/tremolo-ui/commit/5ef3cf8c6d4d79768a92db20252efc9c8ee2dff0) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `PointsEditor` to `@tremolo-ui/svelte`: `PointsEditor.Root`,
  `PointsEditor.Background`, `PointsEditor.Container`, `PointsEditor.Point` and
  `PointsEditor.SelectionBox`. The selection can be bound with
  `bind:selection`.

- [#343](https://github.com/m1m0zzz/tremolo-ui/pull/343) [`13a7a71`](https://github.com/m1m0zzz/tremolo-ui/commit/13a7a71b1f44dde30e247cb2916bf786c7102550) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `Slider` to `@tremolo-ui/svelte`: `Slider.Root`, `Slider.Track`,
  `Slider.Thumb`, `Slider.Marks` and `Slider.MarksOption`.

- [#344](https://github.com/m1m0zzz/tremolo-ui/pull/344) [`828f9e5`](https://github.com/m1m0zzz/tremolo-ui/commit/828f9e56d1c3811446b3c9681d484d53e1af6d85) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `XYPad` to `@tremolo-ui/svelte`: `XYPad.Root`, `XYPad.Area` and
  `XYPad.Thumb`.

### Patch Changes

- [#362](https://github.com/m1m0zzz/tremolo-ui/pull/362) [`eaeeb6f`](https://github.com/m1m0zzz/tremolo-ui/commit/eaeeb6f5ae404fdc3dd4337359446848b71e7b9c) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - `FileInput` and `DropZone` report the rejected files after the accepted ones
  for the same selection or drop. A list of rejected files cleared in
  `onChange` / `onDrop` and filled in `onReject` now shows what a mixed
  selection left out, where it used to be cleared straight away.
- Updated dependencies [[`4a7b743`](https://github.com/m1m0zzz/tremolo-ui/commit/4a7b743cc5f0f17ae851ea56f0616ea3c92f4793), [`63d750f`](https://github.com/m1m0zzz/tremolo-ui/commit/63d750fe331756ee733a39a8fef029f61f3e8790), [`a3bb088`](https://github.com/m1m0zzz/tremolo-ui/commit/a3bb08865ab21f37f08b64d025519421778b395f), [`8309125`](https://github.com/m1m0zzz/tremolo-ui/commit/8309125b79d36073721d1d93f9c0d15e48692268), [`221b3ef`](https://github.com/m1m0zzz/tremolo-ui/commit/221b3efa6f25722f32243cc7038feef1043708dd), [`6a1710f`](https://github.com/m1m0zzz/tremolo-ui/commit/6a1710fc41b5e6c48dd1c8751f43bcb54ec2494b), [`b7dec12`](https://github.com/m1m0zzz/tremolo-ui/commit/b7dec12a1c9674c55617fbaaac4a2122b2ca83e2), [`eaeeb6f`](https://github.com/m1m0zzz/tremolo-ui/commit/eaeeb6f5ae404fdc3dd4337359446848b71e7b9c), [`479f29e`](https://github.com/m1m0zzz/tremolo-ui/commit/479f29ec2a651bc01c4f0fcd03cd90abb6402453)]:
  - @tremolo-ui/dom@0.8.0
  - @tremolo-ui/functions@0.8.0
