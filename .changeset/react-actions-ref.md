---
'@tremolo-ui/react': minor
---

`ref` now reaches the element a part renders, on every part. The methods move
to a new `actionsRef` prop.

`Knob.Root`, `Slider.Root`, `Slider.Thumb`, `XYPad.Root`, `XYPad.Thumb`,
`NumberInput.Root` and `Piano.Root` used to give `ref` an object of methods
(`focus` / `blur`, or `playNote` / `stopNote`), with no way to the element
itself; only `XYPad` passed it along as `original`, which is gone.

- `ref={methodsRef}` → `actionsRef={methodsRef}`; `ref` takes the element
- `xyPadRef.current.original` → `ref` on `XYPad.Root`

`focus` and `blur` stay on `actionsRef` rather than leaving you to call the
element's own: they do nothing while the control is disabled, and on `Slider`,
`XYPad` and `NumberInput` they reach the input inside that takes the focus,
which the root element is not.
