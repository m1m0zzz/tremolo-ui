---
'@tremolo-ui/react': minor
---

Remove appearance props that only forwarded a value to one CSS declaration:
`Piano.Root.height`, `PointsEditor.Root.width` and `height`,
`PointsEditor.Point.size`, `width`, and `height`,
`Slider.MarksOption.labelWidth`, and `XYPad.Area.width`, `height`, and `color`.
Set those values through CSS or `style` instead. The demo theme also uses
ordinary CSS declarations for Piano key colours.
`XYPadAreaProps` is no longer exported; use `ComponentProps<typeof XYPad.Area>`.
