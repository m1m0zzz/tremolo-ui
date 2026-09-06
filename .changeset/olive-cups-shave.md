---
'@tremolo-ui/react': minor
'@tremolo-ui/functions': minor
---

`NumberInput` no longer takes `units` or `digit`. `format` and `parse` are the
only way to control the displayed text, and `unitFormat` builds both:

```tsx
- <NumberInput.Root units={[['Hz', 1], ['kHz', 1000]]} digit={2} ... >
+ <NumberInput.Root {...unitFormat('Hz', { digits: 2 })} ... >
```

`Units`, `formatValue`, `parseValue` and `selectUnit` are removed from
`@tremolo-ui/functions` along with them.

`parse` now reads text with no number in it as `NaN`, and the input keeps its
current value instead of committing a zero the user never typed.
