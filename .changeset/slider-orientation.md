---
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Replace `Slider`'s `vertical` boolean with
`orientation: 'horizontal' | 'vertical'`, the same values the parts already
carry as `data-orientation` (as in Radix and Base UI).

- `vertical` → `orientation="vertical"`

The slider context exposes `orientation` in place of `vertical` too, for parts
of your own that read it.
