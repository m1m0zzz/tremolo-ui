---
'@tremolo-ui/react': minor
---

Fix the Knob arcs overflowing their viewBox. The active and inactive lines were drawn at the full radius, so half of the stroke fell outside the `viewBox` and was rescued with `overflow: visible`. The radius is now inset by half the stroke width, and the `overflow: visible` rules are gone.

Removed the unused `block` and `overflowVisible` props from `Knob.SVGRoot`. `block` was declared but never read, so passing it forwarded an invalid attribute to the `<svg>` element.
