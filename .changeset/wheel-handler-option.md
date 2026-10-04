---
'@tremolo-ui/dom': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

`createWheel` takes its handler as a required `onWheel` option, like
`createLongPress` takes `onPress`: `createWheel(element, { onWheel, requireFocus })`
instead of `createWheel(element, onWheel, { requireFocus })`. The handler was
given twice before, once as an argument and once as an option for `update()`.

The Svelte `wheel` action takes those same options, so `WheelActionOptions` is
gone; the object passed to `use:wheel` does not change.

The Vue `useWheel` no longer accepts `onWheel` among its options. Passing one
replaced the handler given as the second argument on the next update, and
taking it out again left no handler at all.
