---
'@tremolo-ui/react': minor
---

`AnimationCanvas` forwards a ref to its `<canvas>` element.

```jsx
const ref = useRef<HTMLCanvasElement>(null)

<AnimationCanvas ref={ref} draw={draw} />
```
