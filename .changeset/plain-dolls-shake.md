---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Move pointer drag and wheel handling into `@tremolo-ui/dom` as `createDrag` and `createWheel`.

`createDrag` uses Pointer Events only and relies on pointer capture, so the drag keeps working once the pointer leaves the element and no window level listeners are needed. It applies `touch-action: none` so that touch dragging does not scroll the page, and cancels `selectstart` so that a long press does not start a text selection instead.

The drag cursor (`externalStyles.cursor`) is now applied to the dragged element rather than to `document.body`. Pointer capture keeps it in effect once the pointer leaves the element, so there is no need to restyle the whole document, and long pressing no longer flashes a selection across the page.

Fixes a bug where a drag starting at screen coordinate 0 (the top or left edge of the screen) never reported any movement, and a bug where `useDragWithElement` passed stale coordinates to `onDragStart`.

`Slider` and `XYPad` now move to the pointer position on pointer down, instead of waiting for the first movement.

Breaking: `useDrag` now returns a single ref callback instead of `[refCallback, pointerDownHandler]`, and `useDragWithElement` returns `{ refCallback, dragging }` instead of `{ refHandler, pointerDownHandler, dragging }`. A new `useWheel` hook is exported.

Breaking: `DragObserver` and `WheelObserver` are removed. They had become thin wrappers around `useDrag` and `useWheel`, which replace them.
