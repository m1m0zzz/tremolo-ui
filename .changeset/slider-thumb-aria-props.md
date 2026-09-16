---
'@tremolo-ui/react': minor
---

**`SliderThumbProps` no longer lists `aria-label`, `aria-labelledby`,
`aria-describedby` and `aria-valuetext`.** `Slider.Thumb` still takes all four
and still puts them on the range input inside it; only the named type changed.

They were declared with the same types the `div` attributes already give them,
so they added nothing to what `Slider.Thumb` accepts. If you built props with
the type directly, add the attributes back yourself:

```ts
const props: SliderThumbProps & Pick<AriaAttributes, 'aria-label'> = {
  'aria-label': 'Level',
}
```
