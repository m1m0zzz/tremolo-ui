---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Add `createPointsEditor`, the selection and the moves behind
`PointsEditor`: which points a press or a selection box selects, and how a
selection moves as one and stops together at the edge. `clampPoint` and the
point type moved to `@tremolo-ui/dom`; import `clampPoint` and `PointPosition`
(formerly `PointBaseType`) from there. `PointsEditorContextValue` now carries
the editor instance instead of its individual functions.
