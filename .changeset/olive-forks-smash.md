---
'@tremolo-ui/react': patch
---

Warn in development when a subcomponent is rendered at the wrong level.

Children are rendered exactly as they are composed, so `<Slider.Thumb />` left as a sibling of `<Slider.Track>` still renders — it just resolves its `position: absolute` against the page instead of the track, and neither the build nor the tests notice. React says nothing either, except for the SVG parts of `Knob`, where it reports an unrecognized `<path>` tag without saying which component was misplaced.

Each of these now says so, naming the wrong parent when there is one:

- `Slider.Thumb` outside `Slider.Track`, `Slider.MarksOption` outside `Slider.Marks`
- `XYPad.Thumb` outside `XYPad.Area`
- `Knob.ActiveLine` / `Knob.InactiveLine` / `Knob.Thumb` outside `Knob.SVGRoot`
- `PointsEditor.Point` outside `PointsEditor.Container`

It is a warning rather than an error, since the component does render, and the check is dropped from a production build.
