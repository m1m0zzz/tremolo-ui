---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

**`pointerLock` hides the cursor for the length of a drag** on `Knob` and
`NumberInput.Stepper`, reading the pointer movement directly instead of
following it around the screen.

The reason is not tidiness. A relative drag does not care where the pointer is,
but it still stops at the edge of the screen: the operating system pins the
pointer there and the coordinates stop changing, so the value stops moving
however far you keep dragging. A fine drag — shift held, or a low
`dragSensitivity` — reaches that edge quickly.

It is off by default. The browser shows a notice of its own, Esc takes the lock
back, and the request can be refused. A refusal is not an error: the drag
carries on as an ordinary one, since the coordinates are only read as movement
once the lock is actually held. Losing the lock ends the drag, because no
pointerup is coming after it.

Movement that happened while the request was in flight is kept, so the value
does not jump when the lock takes effect.

Not for `Slider`, `XYPad` or `PointsEditor`: their value is the position
pointed at, and `clientX` / `clientY` freeze under the lock. `createDrag` and
`createDragValue` of `@tremolo-ui/dom` take the option, as do the `useDrag` and
`useDragValue` hooks.
