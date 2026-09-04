---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Move the AnimationCanvas loop into `@tremolo-ui/dom` as `createAnimationCanvas`, and stop restarting it on every render

`AnimationCanvas` kept its whole setup — the 2D context, the `ResizeObserver`, the device pixel ratio, the `requestAnimationFrame` loop — inside one effect whose dependencies included `draw`, `init` and `options`. Those are written inline at almost every call site, so they were new on every render and the effect tore everything down and built it again: `init` ran repeatedly, and `count` and `elapsedTime` went back to zero. A canvas next to anything that sets state — a meter reading its level, say — never got past frame 0.

The loop now lives in `@tremolo-ui/dom`:

```ts
const instance = createAnimationCanvas(canvas, { draw, animate, size })
instance.update({ draw: nextDraw }) // swaps the handler, keeps the loop running
instance.redraw()
instance.destroy()
```

The React component is a wrapper that creates the instance once and pushes fresh handlers in with `update()`, the same shape `useDragValue` already used.

Fixed along the way:

- **`width` and `height` had no effect once mounted.** They were not effect dependencies, so changing them reset the canvas's backing store without re-applying the device pixel ratio transform, leaving the drawing at the wrong scale.
- **The first size of a `relativeSize` canvas came from `parent.clientWidth`, later ones from the observer's `contentRect`.** Those differ by the parent's padding, so a padded parent drew at one size and then jumped. The `ResizeObserver` now reports every size, including the first.
- The hidden `<canvas>` used to carry the drawing across a resize is no longer rendered into the document; the core makes one off-document when it needs it.

`AnimationCanvas` keeps the same props. `@tremolo-ui/dom` gains `createAnimationCanvas`, `drawingState` and `isDrawingState`, with the `AnimationFrame`, `AnimationCanvasOptions` and `AnimationCanvasInstance` types.
