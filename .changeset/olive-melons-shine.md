---
'@tremolo-ui/functions': minor
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Redesign `Piano`: the keyboard is no longer built from key components, and several fingers can play at once.

`Piano.Root` used to draw nothing on its own — a note only sounded because `Piano.WhiteKey` / `Piano.BlackKey` called `onPlayNote` from an imperative handle, which `Root` reached through an array of refs indexed by the order of its children. Custom children, or children in a different order, silently broke both the sound and the highlighting. The key geometry was kept in two places as well: `Root` hit-tested with its own white key width while each key drew itself with its own `width` prop, so `<Piano.WhiteKey width={60} />` drew a key that responded somewhere else.

`Root` now owns the keys and everything that is sounding. Per-key customization is two callbacks rather than a component per key.

```jsx
<Piano.Root
  noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
  label={(note, { index }) => SHORTCUTS.HOME_ROW.keys[index]}
  keyProps={(note) => ({ 'data-in-scale': inScale(note, root, 'major') })}
  onPlayNote={(note) => synth.triggerAttack(noteName(note))}
  onStopNote={(note) => synth.triggerRelease(noteName(note))}
/>
```

Each key carries `data-note`, `data-note-key`, `data-active` and `aria-disabled`, so static styling needs no callback at all. The geometry of a key is applied after whatever `keyProps` returns, so a key can no longer be drawn away from where it responds.

Every way of playing a note — pointers, keyboard shortcuts, `playNote()` from the ref — now goes through one instance that counts the sources holding each note, so a note stops only once the last of them lets go. Multi-touch and glissando work: `createDrag` gained `multiPointer`, and `@tremolo-ui/dom` gained `createPianoInput`.

Also new in `@tremolo-ui/functions`: musical scales (`scaleIntervals`, `inScale`, `scaleNotes`) in `midi`, and the piano geometry (`PianoLayout`, `notePosition`, `noteAt`, `pianoWidth`) in `piano`.

Breaking changes:

- `Piano.WhiteKey`, `Piano.BlackKey`, `Piano.KeyLabel` and the `KeyProps` / `KeyMethods` / `KeyLabelProps` types are removed. Use `label` and `keyProps`, or plain CSS on `.tremolo-piano-white-key` / `.tremolo-piano-black-key`
- `label` takes `(note, state)` rather than `(note, index)`; the index is `state.index`. A label of `''`, `null` or `undefined` now draws nothing rather than an empty box
- `getNoteRangeArray` and the `NoteRange` type moved to `@tremolo-ui/functions`
- `whiteNoteWidth` is now `whiteKeyWidth`, and the dead `blackNoteWidth` prop is replaced by `blackKeyWidthRatio` / `blackKeyHeightRatio` / `keyGap`
- `KeyboardShortcuts.flags` is removed. It was declared but never implemented; `SHORTCUTS.HOME_ROW_NATURAL` covers what `naturalOnly` was for, by leaving an empty string where a note has no shortcut
