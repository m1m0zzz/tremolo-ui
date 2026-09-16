---
'@tremolo-ui/react': minor
---

**The props types list only what a part adds.** `className`, `style` and
`children` are no longer declared on these types, because they had the same
types the element attributes already give them:

- `NumberInputProps`, `NumberInputInputFieldProps`, `NumberInputStepperProps`,
  `NumberInputIncrementStepperProps`, `NumberInputDecrementStepperProps`
- `PointsEditorBackgroundProps`, `PointsEditorContainerProps`,
  `PointsEditorSelectionBoxProps`, `PointsEditorPointProps`
- `SliderProps`, `SliderTrackProps`, `SliderThumbProps`, `SliderMarksProps`
- `XYPadAreaProps`, `XYPadThumbProps`

Every part still takes them, and they still go where they went. Only the named
types changed. If you typed props with one of them directly, use the props of
the component instead:

```ts
- const props: SliderThumbProps = { className: 'thumb' }
+ const props: ComponentProps<typeof Slider.Thumb> = { className: 'thumb' }
```

A type that is left with nothing of its own, such as
`NumberInputInputFieldProps`, is kept as an empty interface so that existing
imports still resolve.
