---
'@tremolo-ui/react': minor
---

Stop shipping class names. A part carries what you pass to `className` and nothing else — the `tremolo-` classes are gone, and with them the stylesheet that could reach in without being asked. Styling is now: give every part a class of your own, read the state from the `data-` attributes, and copy the theme from the documentation as a starting point. `Knob.Thumb` loses `classes.thumb`, which named the same element as its `className`.
