---
'@tremolo-ui/vue': minor
---

Export the props types of the components, under the same names as React and
Svelte: `AnimationCanvasProps`, `DropZoneProps`, `FileInputProps`,
`KnobProps`, `KnobThumbProps`, `NumberInputProps`, `PianoProps`,
`PointsEditorProps`, `PointsEditorPointProps`, `SliderProps`,
`SliderMarksProps`, `SliderMarksOptionProps`, `SliderThumbProps`,
`SliderTrackProps`, `XYPadProps` and `XYPadThumbProps`. Each is the public
props of the component as Vue sees them, required props included, so a wrapper
of your own can take and pass them on.
