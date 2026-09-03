---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Move the drag-to-value logic into `@tremolo-ui/dom` as `createDragValue`.

`Slider`, `Knob`, `XYPad` and `PointsEditor` each turned pointer movement into a value on their own. They now share one primitive: a *mapping* decides where the pointer sits on the 0-1 travel of each axis, and the axis options (`min` / `max` / `step` / `skew` / `reverse`) turn that into a value, in the same order everywhere — position, `reverse`, `skew`, rounding to the step, clamping to the range.

Two mappings ship with it. `elementMapping` normalizes the pointer against the bounding rect of an element, so the value is the position pointed at (`Slider`, `XYPad`, `PointsEditor`). `relativeMapping` moves the value away from where it stood when the drag started, by the distance dragged (`Knob`).

Breaking: `useDragWithElement` is replaced by `useDragValue`, which reports values rather than normalized coordinates and covers both mappings.

```jsx
const { refCallback, dragging } = useDragValue({
  axis: { min: 0, max: 100, step: 1 },
  baseElementRef: trackRef,
  updateOnPointerDown: true,
  onChange: ([x]) => setValue(x),
})
```

Breaking: the `XYOrSingle` type of `XYPad` is now `XYInput`, and its pair form is a `readonly` tuple. Its type parameter is constrained to primitives, since a single value is told from a pair with `Array.isArray`, which can only work while the value itself is not an array.

`createDrag` and `createDragValue` also gained `update()`, so a wrapper can feed fresh settings in without tearing down the listeners. Changing `min` or `max` while a drag is in progress no longer aborts it.

Fixes a crash when the element a drag normalizes against has collapsed to zero width or height: the position now reads 0 instead of throwing a `RangeError`.
