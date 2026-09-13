---
'@tremolo-ui/react': minor
---

Say a state by the attribute alone. Every `data-` state is now written only while it is on — `[data-disabled]`, `[data-dragging]`, `[data-selected]` and the rest, rather than `="true"` and `="false"` — and the wrappers that are not controls of their own carry `data-disabled` / `data-readonly` in place of the ARIA they had. The controls themselves (`Knob`, `NumberInput.InputField`, the steppers, the range inputs inside a thumb) keep their ARIA as well: that says what they are, while the `data-` attributes are what the styles read.
