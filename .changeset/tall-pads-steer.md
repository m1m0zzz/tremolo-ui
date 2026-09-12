---
'@tremolo-ui/react': minor
---

Move both axes of `XYPad` and `PointsEditor.Point` with the arrow keys, whichever of the two range inputs holds the focus. The axis used to be read off the focused input, and since the focus lands on the x input, the up and down keys did nothing.
