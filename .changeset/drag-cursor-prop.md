---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Replace `externalStyles: { cursor }` with a `dragCursor` string on `Knob`,
`Slider`, `XYPad` and `PointsEditor`. The object only ever held the cursor
shown while dragging. The defaults stay as they were: `'grabbing'` for `Knob`
and the points of `PointsEditor`, `'pointer'` for `Slider` and `XYPad`.

- `externalStyles={{ cursor: 'move' }}` → `dragCursor="move"`

`NumberInput` takes a `dragCursor` too, for dragging a `Stepper`, where the
cursor was fixed to `'ns-resize'`. `createStepperDrag` in `@tremolo-ui/dom`
takes the matching `cursor` option.

The `PointsEditor` context carries it as `dragCursor`, in place of
`externalStyles` in React and `cursor` in Svelte and Vue.
