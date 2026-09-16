---
'@tremolo-ui/react': minor
---

**Every part's `style` takes CSS custom properties, and suggests its own.**
React's `CSSProperties` has no key starting with `--`, so TypeScript refused
`style={{ '--thickness': '16px' }}` everywhere but on `Piano`. It is accepted on
every part now, and the properties a part writes or reads come up in your
editor:

```tsx
<Slider.Track style={{ '--thickness': '16px' }} />
//                      ^ --active --inactive --length --percent --thickness
```

Any other `--` name is still accepted, for the variables a theme reads.

`CSSVariables` takes those names as a parameter, `CSSVariables<'--gap'>`, and is
exported from the package root rather than from `Piano`. Its default is the
same as before, so `CSSVariables` on its own still means any custom property.

`PianoProps` no longer declares `style`. `Piano.Root` still takes it, with
`--height` suggested; if you typed props with `PianoProps` directly, use
`ComponentProps<typeof Piano.Root>`.
