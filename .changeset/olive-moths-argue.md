---
'@tremolo-ui/functions': patch
---

Fix `stepValue()` rounding a value to the wrong step.

Two cases were wrong. A step small enough that JavaScript prints it in
exponential notation — anything under `1e-6` — has no decimal part to read a
digit count from, and the result was rounded to a whole number instead: a
control with `step={1e-7}` snapped every value below half a step to `0`. And a
value sitting exactly on a half step went up or down depending on where the
error of the division happened to fall, so `0.25` rounded up to `0.3` while
`0.15` and `0.35` rounded down.

Both came from deciding the step by comparing the distance to the two
neighbouring grid points, each computed with its own rounding. The quotient is
now rounded directly, after its artefact is cleared, and a half step always
goes up.
