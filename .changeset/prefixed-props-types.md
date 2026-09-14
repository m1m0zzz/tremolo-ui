---
'@tremolo-ui/react': minor
---

Every exported props type now starts with the name of its component, so the list of types in `@tremolo-ui/react` says which component each one belongs to.

| Before | After |
| --- | --- |
| `StepperProps` | `NumberInputStepperProps` |
| `IncrementStepperProps` | `NumberInputIncrementStepperProps` |
| `DecrementStepperProps` | `NumberInputDecrementStepperProps` |
| `NumberInputFieldProps` | `NumberInputInputFieldProps` |
| `PointProps` | `PointsEditorPointProps` |
| `MarksProps` | `SliderMarksProps` |
| `MarksOptionProps` | `SliderMarksOptionProps` |

`KnobContextValue`, `NumberInputContextValue`, `SliderContextValue` and `XYPadContextValue` are now exported, as `PointsEditorContextValue` already was. Each is what `use<Component>Context` returns and what its selector receives.
