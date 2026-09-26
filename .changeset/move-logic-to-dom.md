---
'@tremolo-ui/dom': minor
---

Add the framework-independent pieces the components were computing on their
own, so that every wrapper gives the same answer: which way an arrow key or a
wheel notch moves a value (`arrowKeyDirection`, `arrowKeyMove`,
`wheelDirection`, `wheelMove`), where a value sits along a track
(`valuePercent`), the knob geometry (`knobAngles`, `knobArcPath`, …), the
slider marks (`sliderMarks`), reading a number input's text
(`parseLeadingNumber`, `caretDecimalOffset`, …), the step check behind the
development warnings (`checkSteps`), the default input options
(`DEFAULT_KEYBOARD_OPTIONS`, `DEFAULT_WHEEL_OPTIONS`,
`DEFAULT_DRAG_SENSITIVITY`), `cssLength`, `visuallyHiddenStyle` and
`partitionByAccept`.
