---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

`PointsEditor.Point` reports when a change of it starts and ends, like the
other controls, in place of `onDragStart` / `onDragEnd` (`drag-start` /
`drag-end` in Vue): `onChangeStart(value, source)` / `onChangeEnd(value,
source)` (`change-start` / `change-end`), with `changeEndDelay`. A drag, the
wheel while the point has the focus, and the arrow keys all count.

The change belongs to the point being operated: the points that move along
with a selection report through `onChange` only, as they did before.

`PointsEditorPoint` in `@tremolo-ui/dom` takes an optional `beforeWheel`, which
`nudgeFocusedPoint` calls just before the wheel moves the point.
