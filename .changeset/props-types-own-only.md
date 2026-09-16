---
'@tremolo-ui/react': minor
---

**The props types list only what a part adds.** `className`, `style` and
`children` are no longer declared on these types, because they had the same
types the element attributes already give them:

- `NumberInputProps`, `PointsEditorPointProps`
- `SliderProps`, `SliderTrackProps`, `SliderThumbProps`, `SliderMarksProps`
- `XYPadAreaProps`, `XYPadThumbProps`

**A part that adds nothing has no props type any more.** These are removed:

- `NumberInputInputFieldProps`, `NumberInputStepperProps`,
  `NumberInputIncrementStepperProps`, `NumberInputDecrementStepperProps`
- `PointsEditorBackgroundProps`, `PointsEditorContainerProps`,
  `PointsEditorSelectionBoxProps`

Every part still takes the same attributes, and they still go where they went.
If you typed props with one of the names, take the props of the component
instead:

```ts
- const props: SliderThumbProps = { className: 'thumb' }
+ const props: ComponentProps<typeof Slider.Thumb> = { className: 'thumb' }

- const props: NumberInputStepperProps = { className: 'stepper' }
+ const props: ComponentProps<typeof NumberInput.Stepper> = { className: 'stepper' }
```
