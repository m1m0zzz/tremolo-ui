---
'@tremolo-ui/functions': minor
'@tremolo-ui/dom': minor
'@tremolo-ui/react': patch
---

**Reading the modifier keys of an input event moves to `@tremolo-ui/dom`.**
`applyDelta`, `selectModifier`, `mapModifier` and the types `InputEventOption`,
`Modifier`, `ModifierMap`, `ModifierState` and `ModifierValue` are no longer
exported by `@tremolo-ui/functions`; import them from `@tremolo-ui/dom`
instead.

```diff
- import { applyDelta, type ModifierValue } from '@tremolo-ui/functions'
+ import { applyDelta, type ModifierValue } from '@tremolo-ui/dom'
```

`ModifierState` is the shape of the modifier flags on a DOM event, and
`applyDelta` decides how far one wheel notch or one key press moves a value —
the same job `createDragValue` already does for a drag. They now sit together,
which is also what a Vue or Svelte wrapper needs in order to implement keyboard
control without reading the React components.

**`selectInputEvent` is gone.** It returned what `selectModifier` returns, with
`value` renamed to `option`, and nothing else:

```diff
- const { option, modifier } = selectInputEvent(keyboard, event)
+ const { value: option, modifier } = selectModifier(keyboard, event)
```

With this, `@tremolo-ui/functions` is four groups of general-purpose functions:
value distributions, numeric conversion, music theory and display formatting.
