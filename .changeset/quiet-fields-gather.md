---
'@tremolo-ui/react': minor
---

`NumberInput.InputField` no longer takes `selectOnFocus` or `blurOnEnter`. Set them on `NumberInput.Root`, which already holds `drag`, `dragSensitivity` and `pointerLock` for the `Stepper`. The parts keep only what belongs to their own element: `className`, `style`, `ref` and the rest of its attributes.

```diff
- <NumberInput.Root value={value} onChange={setValue}>
-   <NumberInput.InputField selectOnFocus="number" blurOnEnter={false} />
+ <NumberInput.Root value={value} onChange={setValue} selectOnFocus="number" blurOnEnter={false}>
+   <NumberInput.InputField />
  </NumberInput.Root>
```
