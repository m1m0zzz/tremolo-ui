---
'@tremolo-ui/dom': patch
'@tremolo-ui/functions': patch
'@tremolo-ui/react': patch
---

**Values no longer collect binary float debris.** Holding shift and pressing
the arrow key twelve times from 5 used to reach 5.699999999999998, and the
input showed exactly that. The fine-adjustment modifier deliberately takes
`step` out of the pipeline, and `step` was the only thing rounding the
artefact back.

A value is now rounded to the 15 significant digits a double actually carries,
at the two places a value is produced: `applyDelta`, which the wheel and the
arrow keys go through, and `createDragValue`, which every drag goes through.
Rounding happens before the clamp, so `min` and `max` still have the last word.

This is not rounding in the sense `step` is. `step` puts a value on a grid you
asked for; this removes digits that were never in the value — the result of a
float calculation already carries error that size or larger, so nothing real
is lost. There is no way to turn it off, and no reason to want one.

`toPrecision(x, significantDigits = 15)` is exported from
`@tremolo-ui/functions` alongside the existing `toFixed`, with
`SIGNIFICANT_DIGITS` for the default.
