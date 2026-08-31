# @tremolo-ui/react

## 0.3.0

### Minor Changes

- [`2a40e1c`](https://github.com/m1m0zzz/tremolo-ui/commit/2a40e1c50c57c44a2bdbd7d67310488f66d4b9c1) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Add `@tremolo-ui/dom`, a framework-agnostic DOM layer, and move the Web MIDI logic into it as `createMIDIAccess` / `createMIDIMessage` / `createMIDIInput`.
  
  `useMIDIAccess`, `useMIDIMessage` and `useMIDIInput` keep the same signatures and now call the core internally.

### Patch Changes

- Updated dependencies [[`2a40e1c`](https://github.com/m1m0zzz/tremolo-ui/commit/2a40e1c50c57c44a2bdbd7d67310488f66d4b9c1)]:
  - @tremolo-ui/dom@0.3.0
  - @tremolo-ui/functions@0.3.0

## 0.2.1

### Patch Changes

- [`e8f4e6e`](https://github.com/m1m0zzz/tremolo-ui/commit/e8f4e6ea6de41d48a2f9e4611813ec7cb0cc202d) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Fix the `@tremolo-ui/functions` dependency range, which was left at `^0.1.6` while the package was released as 0.2.0.
- Updated dependencies []:
  - @tremolo-ui/functions@0.2.1
