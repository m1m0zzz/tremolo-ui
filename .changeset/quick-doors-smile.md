---
'@tremolo-ui/react': minor
---

Give `Knob` a default size. Without the `size` prop the element collapsed to nothing, because `width` and `height` were set to `undefined` and the SVG inside has no intrinsic size. The default now lives in the CSS as `--knob-size` (50px) and `size` still overrides it.
