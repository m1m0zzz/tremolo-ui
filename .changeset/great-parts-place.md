---
'@tremolo-ui/react': minor
---

Place the parts from the component rather than from the stylesheet. A thumb, a mark, a point and the selection box take themselves out of flow and centre on the value they are given, and the layers of `PointsEditor` and the keys of `Piano` keep their order whichever way they are written — so a stylesheet of your own cannot put a part in the wrong place by leaving a rule out. Where the placement has room for taste, `--translate` moves a thumb, a mark or a point off its centre.
