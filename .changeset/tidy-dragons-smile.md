---
'@tremolo-ui/react': minor
---

Remove `externalStyles.userSelectNone` from Knob, Slider, XYPad, and PointsEditor. Drag selection is already suppressed by `@tremolo-ui/dom`, and `externalStyles.cursor` now accepts every CSS cursor value.
