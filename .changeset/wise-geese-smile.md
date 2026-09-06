---
'@tremolo-ui/functions': minor
---

Add `unitFormat`, which builds the `format` and `parse` pair of a unit.

```tsx
<NumberInput.Root {...unitFormat('Hz', { digits: 2 })} value={v} onChange={setV}>
```

It picks an SI prefix by magnitude (`1234` reads `1.23kHz`), takes a `base`
option for values that are already stored in a prefixed unit (milliseconds are
`unitFormat('s', { base: 'm' })`), and can be told to add no prefix at all with
`prefixes: false`, for dB, %, cents and the like.
