---
'@tremolo-ui/react': minor
---

`AnimationCanvas` and `Piano` now call following the size of the parent element `resizable`. `relativeSize` on `AnimationCanvas` and `fill` on `Piano` are gone.

```diff
- <AnimationCanvas relativeSize draw={draw} />
+ <AnimationCanvas resizable draw={draw} />

- <Piano.Root fill>
+ <Piano.Root resizable>
```

The props of `AnimationCanvas` are split by `resizable`. `width` and `height` belong to a fixed canvas, and passing them together with `resizable` is now a type error; before, both were accepted and `width` / `height` were silently ignored. The types are renamed to match:

| Before | After |
| --- | --- |
| `CommonProps` | `AnimationCanvasCommonProps` |
| `AbsoluteSizingProps` | `AnimationCanvasFixedProps` |
| `RelativeSizingProps` | `AnimationCanvasResizableProps` |

`reduceFlickering` moves to `AnimationCanvasCommonProps`: a fixed canvas is resized too when its `width` or `height` changes, and the option applies there as well.
