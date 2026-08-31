---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Move pointer drag and wheel handling into `@tremolo-ui/dom` as `createDrag` and `createWheel`.

`createDrag` uses Pointer Events only and relies on pointer capture, so the drag keeps working once the pointer leaves the element and no window level listeners are needed.

Fixes a bug where a drag starting at screen coordinate 0 (the top or left edge of the screen) never reported any movement, and a bug where `useDragWithElement` passed stale coordinates to `onDragStart`.

Breaking: `useDrag` now returns a single ref callback instead of `[refCallback, pointerDownHandler]`, and `useDragWithElement` returns `{ refCallback, dragging }` instead of `{ refHandler, pointerDownHandler, dragging }`. A new `useWheel` hook is exported.
