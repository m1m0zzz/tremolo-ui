---
'@tremolo-ui/react': minor
---

Unify `Slider`, `Knob` and `XYPad` on one implementation.

The three had diverged in how they treated `children`, and that decided where `value` lived. `Slider` and `XYPad` harvested props off their children and re-rendered their own markup, so the value could be passed down as props; `Knob` rendered children as written, so it had to keep the value in a store. All three now render children as written and read from a context that is derived during render, so there is no state to keep in sync.

Breaking: `children` is required. There is no default markup to fall back to, so adding one child no longer makes the rest disappear.

```jsx
<Slider.Root value={value} min={0} max={100} onChange={setValue}>
  <Slider.Track>
    <Slider.Thumb />
  </Slider.Track>
</Slider.Root>
```

Breaking: `Slider.Thumb` goes inside `Slider.Track`, and `XYPad.Thumb` inside `XYPad.Area`, rather than being siblings.

Breaking: `XYPad` takes per-axis settings as `[x, y]` tuples mirroring `Slider`, instead of `x` and `y` option objects. A plain value applies to both axes. `onChange`, `onDragStart` and `onDragEnd` now receive a single `[x, y]` tuple. Per-axis `wheel` and `keyboard` options are gone; the pad takes one of each.

```jsx
<XYPad.Root value={[x, y]} min={0} max={100} onChange={([x, y]) => ...}>
  <XYPad.Area>
    <XYPad.Thumb />
  </XYPad.Area>
</XYPad.Root>
```

The space reserved for the thumb is now the `--thumb-size` CSS variable on `Slider` and `XYPad`, since the root can no longer read the thumb's size off its children.
