---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Report when a change of value starts and ends, whatever makes it, for hosts
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
