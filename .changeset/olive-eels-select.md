---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

**`PointsEditor` selects points, and a selection moves as one**, with
`selectable`.

It is off by default. Selection changes what a press and a drag mean, and an
editor whose points each mean something different — the four handles of an
ADSR envelope, say — has nothing to gain from moving them together.

- a press selects the point it landed on
- **ctrl or ⌘ adds to the selection** — not shift, which is the
  fine-adjustment key on every control here and cannot be both
- a drag on empty space draws a rubber band and selects what it covers
- dragging or arrow-keying one selected point moves the whole selection

The editor keeps the selection unless you take it over with `selection` /
`onSelectionChange`. Points are named by their `id` prop, or by one generated
to last as long as the point is mounted. A selected point carries
`data-selected="true"`, and the rubber band is
`.tremolo-points-editor-marquee`.

A selection stops as a whole when any one of its points reaches a limit.
Clamping each point on its own would leave that one behind while the rest
carried on, pulling the selection out of shape.

**A drag now moves a point rather than putting it under the pointer.** Grabbing
a point at its edge used to shift it under the cursor on the first movement.
It keeps the offset it was grabbed at now — which is also what makes moving
several at once mean anything.

Deleting and duplicating are not included: the points are yours, and only you
know what the array behind them is.

`createDrag` of `@tremolo-ui/dom` takes `shouldStart`, which decides whether a
pointerdown starts a drag at all. It is checked **before the pointer is
captured**, which is the whole point: a rubber band on a container has to
decline a press that landed on one of the objects it would select, and
declining any later means the capture has already been taken away from the
object that was going to handle it.

`useDragValue`'s handlers receive the `DragState` as a second argument, the
way `useDrag`'s do.

Two things to know when you turn it on.

**Update each point from the previous state.** A selection calls `onChange` on
several points in the same tick, so a handler that rebuilds its state from a
value captured in the render keeps only the last one, and every point but one
appears stuck:

```jsx
// good
onChange={(v) => setPoints((prev) => ({ ...prev, [id]: v }))}
// throws away every call but the last
onChange={(v) => setPoints({ ...points, [id]: v })}
```

**The rubber band puts a drag on `PointsEditor.Container`**, and a drag sets
`touch-action: none` on what it holds, so dragging a finger across the editor
draws a selection rather than scrolling the page. That was already true over a
point; with `selectable` it is true over the whole surface. Without it the
container takes no drag at all.
