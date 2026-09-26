---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

`createPianoInput` now plays notes from the computer keyboard itself, with the
new `keyboardShortcuts` and `keyboardShortcutsScope` options, so that every
wrapper's Piano handles held keys, focus loss and changes to the mapping the
same way. `SHORTCUTS` and `KeyboardShortcuts` moved to `@tremolo-ui/dom`:
import them from there instead of `@tremolo-ui/react`.
