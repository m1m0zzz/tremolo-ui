---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Treat everything in a number input's text that is not the unit as the number.
`selectOnFocus="number"` and `keepCaretOnStep` now cover a signed number
(`+6.0 dB`, `−6.0 dB`), an exponent (`1e+21`) and a number after a unit
(`L 30`), where they used to select nothing or stop part way.

The default `parse` reads the same number, and gives `NaN`, which leaves the
value alone, for one it cannot read whole instead of the digits in front:
`1,000 Hz` and `1:30` no longer commit 1, and a number with a unit in front is
left to a `parse` of your own. `parseLeadingNumber` and `leadingNumberLength`
in `@tremolo-ui/dom` become `parseNumberText` and `numberSpan`.
