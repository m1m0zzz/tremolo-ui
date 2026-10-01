---
'@tremolo-ui/react': minor
---

Remove `useInterval`, and rework `useEventListener` and `useAnimationFrame`.

`useEventListener` no longer listens on `document` when the target is `null`:
`null` and a function returning `null` both listen on nothing, so pass
`document` by name. A target and options written inline are compared by what
they resolve to, and the listener is re-attached only when the element, the
event or an option changes. `signal` is no longer accepted, and the argument
types are exported as `UseEventListenerTarget` and `UseEventListenerOptions`.

`useAnimationFrame` requires its callback and passes it the frame's timestamp
and the milliseconds since the previous frame. The `deps` argument is replaced
by `{ disabled }`, which stops the loop; the callback was already read on every
frame, so `deps` only restarted it. The options are exported as
`UseAnimationFrameOptions`.
