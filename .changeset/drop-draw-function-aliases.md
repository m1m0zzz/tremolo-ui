---
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Remove the `DrawFunction` and `InitFunction` types from the wrappers. They were
other names for `CanvasDrawFunction` and `CanvasInitFunction` in
`@tremolo-ui/dom`, which `AnimationCanvas` now takes directly: import those
instead.

The Svelte and Vue `AnimationCanvas` no longer say that `init` runs again after
a resize. It never did: it runs once, before the first frame.
