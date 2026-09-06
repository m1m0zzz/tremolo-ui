---
'@tremolo-ui/react': minor
---

**Every appearance prop now writes a custom property, and the default moved
into the CSS.**

```jsx
<Slider.Track thickness={16} />
// is exactly
<Slider.Track style={{ '--thickness': '16px' }} />
```

Four different shapes had grown up for the same idea: a prop that fell through
to the CSS (`Knob`'s `size`), a prop with a default in JavaScript that a
stylesheet could not override without `!important` (`Slider.Track`'s `length`
and `thickness`), a gradient built inline that CSS could not reach at all, and
a prop that set a custom property (`Slider.Thumb`'s `color`). The last one won.

The prop, a stylesheet rule and an inline style are now three ways to say one
thing, and the usual cascade decides. Because the default lives in the CSS, one
rule changes every instance:

```css
.tremolo-slider-track {
  --thickness: 16px;
}
```

A number is taken as pixels; a string is written through, so `'3rem'`,
`'100%'` and `'auto'` all work.

**`Slider.Track` no longer paints itself, and `defaultStyle` is gone.** The
track publishes `--percent` — where the value sits, the one number CSS cannot
work out on its own — and the fill is a rule in the theme. Drawing the track
yourself means writing that rule rather than opting out of ours.

Positions computed from the value stay inline: a thumb's `left`, a point's
`top`, the `left` of a piano key. Those are the value, not a style.

New state attributes: `data-flipped` on `Slider.Track` for a value that grows
from the far end, `data-fill` on `Piano`, and `data-vertical` on
`Slider.Marks`.

If you are not using the theme from the docs, `Slider.Track`, `XYPad.Area`,
`PointsEditor`, `PointsEditor.Point` and `Piano` no longer carry a size of
their own — give them one, in CSS or through the props that now feed it.
