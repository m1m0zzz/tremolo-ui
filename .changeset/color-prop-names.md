---
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Name the props that take a colour `*Color`, after `color` on `Slider.Thumb`
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
