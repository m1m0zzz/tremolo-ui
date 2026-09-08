---
'@tremolo-ui/react': minor
---

**`Slider.Thumb` and `XYPad.Thumb` are one element**, and `children` are
rendered inside it.

The thumb used to be a positioned wrapper around either the caller's children
or a default thumb of its own. The wrapper could not be given a `className` or
a `style` — `XYPad.Thumb` took `wrapperClassName` and `wrapperStyle` for it and
`Slider.Thumb` had no way at all — and passing children silently dropped
`className` and `style`, along with the ref that `Root.focus()` and the
focus-on-drag both go through.

Now there is a single element. It carries the position, the class name, the
state attributes and the focus, and whatever is passed as `children` is drawn
inside it.

```diff
-<Slider.Thumb>
-  <img src="thumb.png" />
-</Slider.Thumb>
+<Slider.Thumb style={{ background: 'none', width: 'auto', height: 'auto' }}>
+  <img src="thumb.png" />
+</Slider.Thumb>
```

**Breaking.**

- The `tremolo-slider-thumb-wrapper` and `tremolo-xy-pad-thumb-wrapper`
  elements are gone. CSS written against them belongs on
  `tremolo-slider-thumb` / `tremolo-xy-pad-thumb`, which now needs the
  positioning the wrapper used to hold: `position: absolute` and a
  `translate: -50% -50%` to centre it on its point
- `XYPad.Thumb` no longer takes `wrapperClassName` or `wrapperStyle`. Its
  `className` and `style` reach the same element those used to
- Children no longer replace the thumb. Where they were a whole replacement,
  turn the thumb's own appearance off through `style` or `className`
- A thumb was hidden by passing an empty fragment as its children, which the
  truthiness check read as "the caller drew something". Use
  `style={{ display: 'none' }}`
- `children` of `0` or `''` now render, instead of being replaced by the
  default thumb

`Slider.Thumb` also accepts the props of the `div` it renders, as
`XYPad.Thumb` already did.
