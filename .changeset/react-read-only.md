---
'@tremolo-ui/react': minor
---

Rename `readonly` to `readOnly` on `Knob`, `NumberInput`, `PointsEditor`,
`PointsEditor.Point`, `Slider` and `XYPad`, after React's own DOM props. The
contexts that carry it (`NumberInput`, `PointsEditor`, `Slider`, `XYPad`) use
`readOnly` too. The `data-readonly` attribute does not change, and Svelte and
Vue keep `readonly`.

- `readonly` → `readOnly`
