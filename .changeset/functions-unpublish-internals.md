---
'@tremolo-ui/functions': minor
'@tremolo-ui/react': patch
---

**`@tremolo-ui/functions` drops five exports that were never meant for you.**
The package is for general-purpose functions — the ones worth having whether or
not you use the rest of this library — and these were implementation details
that became public by being pure.

| Removed | Instead |
| --- | --- |
| `mod` | `((n % m) + m) % m`, three characters longer than the import |
| `xor` | `a !== b`, or `!!a !== !!b` when either side may be `undefined` |
| `integerPart` | `String(Math.trunc(x))` |
| `decimalPart` | `String(x).split('.')[1]`, though see below |
| `SIGNIFICANT_DIGITS` | nothing. It was only ever the default of `toPrecision`, which still applies on its own |

`integerPart` and `decimalPart` returned `string | undefined` and both broke on
the exponent form: `String(1e-7)` is `'1e-7'`, which has no decimal point, so
`decimalPart` reported no digits at all.

**`Slider.Marks` labels an interval written in exponent form correctly.** It
used `decimalPart` to decide how far to round each label back, so a `step` or
`per` of `1e-7` rounded every label to a whole number. It now counts the digits
the exponent stands for.
