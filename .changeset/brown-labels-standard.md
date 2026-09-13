---
'@tremolo-ui/react': minor
---

Take the accessible name through the standard `aria-*` props. `XYPad.Thumb` accepts `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-valuetext` — one value for both axes, or a pair for one each — in place of `ariaLabels` and `ariaValueText` on `XYPad.Root`, and `PointsEditor.Point` takes `aria-label` and `aria-valuetext` the same way. They reach the range inputs that carry the semantics; passing them before only decorated the wrapper.
