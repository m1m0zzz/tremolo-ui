---
'@tremolo-ui/react': minor
---

Remove `externalStyles.userSelectNone` from Knob, Slider, XYPad, and PointsEditor. The React body-style guard duplicated drag selection handling in `@tremolo-ui/dom` and did not prevent iOS Safari's existing unfocused long-press selection. `externalStyles.cursor` now accepts every CSS cursor value.

Export the shared keyboard, wheel, and drag defaults as `DEFAULT_KEYBOARD_OPTIONS`, `DEFAULT_WHEEL_OPTIONS`, and `DEFAULT_DRAG_SENSITIVITY`.
