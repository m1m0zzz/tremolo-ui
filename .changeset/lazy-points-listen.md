---
'@tremolo-ui/react': minor
---

Listen for the wheel once on `PointsEditor.Container` instead of once per `PointsEditor.Point`. The focused point still takes the notch from anywhere over the editor, but the number of native listeners no longer grows with the number of points. `PointsEditorContextValue` gains `nudgeFocusedPoint`, and a point's registration now carries its element and its resolved wheel option.
