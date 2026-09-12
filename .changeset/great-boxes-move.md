---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Move the selection box of `PointsEditor` into the core as `createSelectionBox`: which items a rectangle covers, and whether a press adds to the selection or replaces it, no longer live in React. `PointsEditorContextValue.selectionBox` now carries the core's `SelectionBoxRect`, and the React-only `SelectionBox` type is gone.
