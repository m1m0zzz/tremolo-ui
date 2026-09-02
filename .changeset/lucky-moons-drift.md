---
'@tremolo-ui/dom': patch
'@tremolo-ui/react': patch
---

Fix a slow drag not registering. Movement below `createDrag`'s threshold was discarded instead of carried over, and pointer coordinates are fractional, so dragging slowly moved less than a pixel per event and never reported anything. It now accumulates until it crosses the threshold.

The threshold also now defaults to 0 in `createDrag`, which restores `useDragWithElement` (used by `Slider`, `XYPad` and `PointsEditor`) to having no threshold at all, as it did before the move to `@tremolo-ui/dom`. `useDrag` still defaults to 1.
