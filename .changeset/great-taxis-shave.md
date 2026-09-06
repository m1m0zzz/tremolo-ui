---
'@tremolo-ui/react': minor
---

**Shift is now the fine-adjustment key on the arrow keys.** Every component
moves by a tenth of a step with it held, which is the convention on hardware
controllers and in every DAW.

`wheel` and `keyboard` accept a map naming the modifier if you want something
else, and a plain tuple opts out of modifiers entirely:

```tsx
keyboard={{ default: ['raw', 1], alt: ['raw', 0.5] }}
keyboard={['raw', 1]}
```

Nothing is bound on the wheel: browsers turn shift+wheel into horizontal
scrolling, so shift is not ours to take there.

Fixes shift+wheel on `XYPad` and `PointsEditor`, which could only ever raise
the x value. The direction was read from `deltaY`, which browsers leave empty
once they move the scroll to `deltaX`. A trackpad's own horizontal gesture now
moves x too, with no modifier.
