---
'@tremolo-ui/react': patch
---

Export the props types of `Knob.SVGRoot` and `Knob.Thumb` as `KnobSVGRootProps` and `KnobThumbProps`. `NumberInputIncrementStepperProps` and `NumberInputDecrementStepperProps` are now interfaces rather than aliases, so the API reference lists their props.

Every props type now documents each of its props, with `@default` where there is one. The descriptions of `wheel` and `keyboard` no longer say that shift moves a tenth of a step: the amount is in the units of the value, which is a tenth of a step only while `step` is 1.
