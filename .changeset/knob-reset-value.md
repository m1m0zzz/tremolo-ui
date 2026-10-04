---
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Replace `Knob`'s `defaultValue` and `enableDoubleClickDefault` with one
`resetValue?: number | null`. It is the value a double click restores, and
`null` turns the double click off, as `null` does for `wheel` and `keyboard`.
`default*` reads as the starting value of an uncontrolled control, which this
never was.

The value restored by default is now `startValue` rather than `min`, so a
bipolar knob such as a pan returns to its centre without saying so twice.
`startValue` itself still defaults to `min`.

- `defaultValue={v}` → `resetValue={v}`
- `enableDoubleClickDefault={false}` → `resetValue={null}`
