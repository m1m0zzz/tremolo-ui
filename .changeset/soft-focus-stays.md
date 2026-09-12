---
'@tremolo-ui/react': minor
---

Keep the focus inside `Slider` and `PointsEditor.Point` after a press. Neither the track, the thumb nor the point could hold focus, so the browser cleared it to the body and undid the focus the drag had just given the hidden input — leaving the arrow keys dead until the control was tabbed to. Both now take the focus themselves and pass it on to the input.
