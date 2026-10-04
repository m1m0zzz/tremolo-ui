---
'@tremolo-ui/dom': minor
'@tremolo-ui/functions': minor
---

Drop the MIDI error constants `NOT_SUPPORTED`, `PERMISSION_DENIED` and
`UNAVAILABLE` from `@tremolo-ui/dom`. `MIDIAccessError` is a union of those
strings, so compare `error` with `'NOT_SUPPORTED'` and the rest directly: the
type still catches a misspelling.

`PITCH_BEND_CENTER` moves from `@tremolo-ui/dom` to `@tremolo-ui/functions`,
next to a new `normalizePitchBend`, which turns a 14-bit pitch bend into -1 to
1. It divides each side of the centre by its own length, so both ends are
reached exactly.
