---
'@tremolo-ui/functions': minor
'@tremolo-ui/dom': minor
'@tremolo-ui/react': patch
---

**The geometry of a drawn keyboard moves to `@tremolo-ui/dom`.** `noteAt`,
`notePosition`, `pianoWidth`, `blackKeyWidth`, `getNoteRangeArray`,
`PianoLayout` and `NoteRange` are no longer exported by
`@tremolo-ui/functions`; import them from `@tremolo-ui/dom` instead. Nothing
about them changed.

```diff
- import { noteAt, type PianoLayout } from '@tremolo-ui/functions'
+ import { noteAt, type PianoLayout } from '@tremolo-ui/dom'
```

They are pixel positions and hit testing for a keyboard that has been drawn,
which is the layer `@tremolo-ui/dom` is for. `@tremolo-ui/functions` keeps the
music theory — `noteNumber`, `noteName`, `noteToFrequency`, the scales — which
is useful whether or not anything is on screen.
