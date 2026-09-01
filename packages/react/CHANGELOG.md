# @tremolo-ui/react

## 0.4.0

### Minor Changes

- [#133](https://github.com/m1m0zzz/tremolo-ui/pull/133) [`c0bda83`](https://github.com/m1m0zzz/tremolo-ui/commit/c0bda8399f2ba686b9ce2144dd4341b26ae0eb34) Thanks [@m1m0zzz](https://github.com/m1m0zzz)! - Move pointer drag and wheel handling into `@tremolo-ui/dom` as `createDrag` and `createWheel`.
  
  `createDrag` uses Pointer Events only and relies on pointer capture, so the drag keeps working once the pointer leaves the element and no window level listeners are needed. It applies `touch-action: none` so that touch dragging does not scroll the page, and cancels `selectstart` so that a long press does not start a text selection instead.
  
  The drag cursor (`externalStyles.cursor`) is now applied to the dragged element rather than to `document.body`. Pointer capture keeps it in effect once the pointer leaves the element, so there is no need to restyle the whole document, and long pressing no longer flashes a selection across the page.
  
  Fixes a bug where a drag starting at screen coordinate 0 (the top or left edge of the screen) never reported any movement, and a bug where `useDragWithElement` passed stale coordinates to `onDragStart`.
  
  `Slider` and `XYPad` now move to the pointer position on pointer down, instead of waiting for the first movement.
  
  Breaking: `useDrag` now returns a single ref callback instead of `[refCallback, pointerDownHandler]`, and `useDragWithElement` returns `{ refCallback, dragging }` instead of `{ refHandler, pointerDownHandler, dragging }`. A new `useWheel` hook is exported.
  
  Breaking: `DragObserver` and `WheelObserver` are removed. They had become thin wrappers around `useDrag` and `useWheel`, which replace them.

### Patch Changes

- Updated dependencies [[`c0bda83`](https://github.com/m1m0zzz/tremolo-ui/commit/c0bda8399f2ba686b9ce2144dd4341b26ae0eb34)]:
  - @tremolo-ui/dom@0.4.0
  - @tremolo-ui/functions@0.4.0

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
