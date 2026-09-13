---
'@tremolo-ui/react': minor
---

Name the orientation on `Slider` instead of asking whether it is vertical: the parts now carry `data-orientation="horizontal"` or `data-orientation="vertical"` in place of `data-vertical`, which is what the rest of the ecosystem uses. The `data-axis` on `XYPad`'s inputs is `x` / `y` as well, matching `PointsEditor`.
