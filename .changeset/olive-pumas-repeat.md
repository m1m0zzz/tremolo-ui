---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Add `@tremolo-ui/dom`, a framework-agnostic DOM layer, and move the Web MIDI logic into it as `createMIDIAccess` / `createMIDIMessage` / `createMIDIInput`.

`useMIDIAccess`, `useMIDIMessage` and `useMIDIInput` keep the same signatures and now call the core internally.
