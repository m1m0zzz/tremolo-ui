# @tremolo-ui/dom

## 0.3.0

### Minor Changes

- [`2a40e1c`](https://github.com/m1m0zzz/tremolo-ui/commit/2a40e1c50c57c44a2bdbd7d67310488f66d4b9c1) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `@tremolo-ui/dom`, a framework-agnostic DOM layer, and move the Web MIDI logic into it as `createMIDIAccess` / `createMIDIMessage` / `createMIDIInput`.
  
  `useMIDIAccess`, `useMIDIMessage` and `useMIDIInput` keep the same signatures and now call the core internally.
