---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

**Breaking:** Piano keyboard shortcuts now listen from the focused root instead of the whole page by default. The root is a focusable `group`; set `keyboardShortcutsScope="window"` to keep page-wide shortcuts. Held shortcut notes are released when mappings change, focus is lost, or the component unmounts, and shortcuts no longer play outside the displayed range or while editing text.

Lowering `midiMax` now releases active notes above the new limit, including every source and pointer holding them.
