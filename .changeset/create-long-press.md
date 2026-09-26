---
'@tremolo-ui/dom': minor
---

Add `createLongPress`, the press-and-hold repeat behind `useLongPress` and the
`NumberInput` steppers: it fires once on the press, then every `interval`
after `delay`, until the pointer that started it is released.
