---
'@tremolo-ui/dom': minor
---

Rename the `relativeSize` option of `createAnimationCanvas` to `resizable`, matching `AnimationCanvas` and `Piano` in `@tremolo-ui/react`.

```diff
- createAnimationCanvas(canvas, { draw, relativeSize: true })
+ createAnimationCanvas(canvas, { draw, resizable: true })
```
