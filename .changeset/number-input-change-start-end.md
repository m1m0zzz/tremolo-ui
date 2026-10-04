---
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

`NumberInput` reports when a change of its value starts and ends, like `Knob`,
`Slider` and `XYPad`: `onChangeStart(value, source)` / `onChangeEnd(value,
source)` (`change-start` / `change-end` in Vue), with `changeEndDelay`.

- A press on a stepper is one change from the press to the release, wherever
  the pointer ends up: the first step, the repeats while it is held, and a drag
  on the stepper all belong to it
- Typing starts a keyboard change with the first character that changes the
  value, and committing the text ends it
- The wheel and the arrow keys end `changeEndDelay` after the last notch or key
  press
