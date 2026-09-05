---
'@tremolo-ui/react': minor
---

Rebuild `PointsEditor` on plain React context, and make its `wheel` / `keyboard` props do something. `zustand` is gone from the dependencies of `@tremolo-ui/react` with it.

`PointsEditor` was the last component keeping its settings in a zustand store. Everything in that store was derived from the props of `Root`, so it is now a plain context like `Slider` and `XYPad` have. Three bugs went with it:

- `<PointsEditor.Root readonly>` did nothing. `Point` read `readonly` from the context for its ARIA attribute, but guarded the drag with its own prop only, so the points still moved. `readonly` and `disabled` now reach every `Point`, and a `Point` can still override either
- `wheel` and `keyboard` were declared, typed and documented on `Root`, but nothing was ever wired to them. The arrow keys now nudge the focused point (y grows downwards, so ArrowUp moves it up) and the wheel moves it while it has focus, with shift selecting the x axis — the same conventions as `XYPad`. `Root` sets the default and a `Point` can override it, `null` turning the input off

  Unlike a slider, an editor has several movable points, so the wheel listens on the container rather than on each point: a wheel event only reaches what the cursor is over, and a point is a 16px target. Every point sees the event and the focused one acts, so the wheel works anywhere over the editor. While a point has focus the editor takes the scroll, as `Slider` and `XYPad` already do
- `Container` called into the store while rendering, replacing the container element on every mount. It now composes the context ref with whatever ref you pass, so `<PointsEditor.Container ref={...} />` works

Breaking changes:

- `PointsEditorProps.grid` is removed. It was never implemented and leaked onto the DOM as a `grid` attribute
- `PointsEditorProps.children` is now required, matching the other components
- `usePointsEditorContext` no longer requires a selector; calls that pass one are unaffected
- A readonly point no longer shows a `grab` cursor, since dragging it does nothing

`useWheel` gained a `target` option for this, listening on an element that is managed elsewhere instead of on the one its ref callback is attached to.
