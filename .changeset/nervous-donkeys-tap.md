---
'@tremolo-ui/functions': minor
'@tremolo-ui/react': minor
---

**Shift makes a `NumberInput.Stepper` drag fine too.** `dragSensitivity` on
`NumberInput.Root` says how much the drag counts per modifier key, default
`{ default: 1, shift: 0.1 }`: `drag` pixels then move a tenth of a `step`
rather than a whole one. As on the arrow keys, a modifier amount is not
snapped back onto the grid.

The three handlers of `useDrag` now receive the whole `DragState`. `onDrag`
had only the four numbers, and the modifier keys live on the event:

```ts
useDrag({ onDrag: (x, y, deltaX, deltaY, state) => state.event.shiftKey })
```

Arguments were added rather than replaced, so existing handlers keep working.

`mapModifier` is new in `@tremolo-ui/functions`. It carries a per-modifier
setting over to another kind of setting, keeping which modifier each belongs
to:

```ts
mapModifier({ default: 1, shift: 0.1 }, (f) => ['raw', step * f])
// { default: ['raw', 1], shift: ['raw', 0.1] }
```

Keeping the map rather than resolving it first is what lets a fine drag move
at all — naming a modifier is also what takes `step` out of the pipeline.
