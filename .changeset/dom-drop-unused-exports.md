---
'@tremolo-ui/dom': minor
---

Stop exporting what no wrapper uses: `drawingState`, `isDrawingState` and the
`DrawingContext` / `DrawingState` / `DrawingStateValue` types, `knobArcPoint`,
`isArrowKey` and `ArrowKey`, `mapModifier`, `noteAt`, `createSelectionBox`,
`selectionBoxCovers` and their option and instance types, and
`matchesAccept`. `SelectionBoxRect` stays, as the shape of a points editor's
selection box. `isDrawingState` is removed outright.
