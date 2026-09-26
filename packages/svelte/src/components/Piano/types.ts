import type {
  KeyboardShortcuts,
  KeyboardShortcutsScope,
  NoteRange,
} from '@tremolo-ui/dom'

import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

/** What a key is, when `label` or `keyProps` is asked about it. */
export interface KeyState {
  /** Position in the note range, counting from `noteRange.first`. */
  index: number
  keyType: 'white' | 'black'
  /** Whether the note is currently sounding. */
  active: boolean
  /** Whether the note is above `midiMax` and cannot sound. */
  disabled: boolean
}

/** What `keyProps` may return for one key. */
export type KeyAttributes = HTMLAttributes<HTMLDivElement> &
  Record<`data-${string}`, string | number | boolean | undefined>

export interface PianoProps {
  /** Classes for the label inside each key. */
  classes?: { keyLabelWrapper?: string; keyLabel?: string }
  /** The notes drawn, from `first` to `last`. */
  noteRange: NoteRange
  /**
   * Let a pointer slide from one key to the next while it is down.
   * @default true
   */
  glissando?: boolean
  /**
   * Highest note that can sound. Keys above it carry `data-disabled`.
   * @default 127
   */
  midiMax?: number
  /**
   * Play notes from the computer keyboard: `keys[i]` plays
   * `noteRange.first + i`. `SHORTCUTS` from `@tremolo-ui/dom` has
   * ready-made layouts.
   */
  keyboardShortcuts?: KeyboardShortcuts
  /**
   * Where keyboard shortcuts listen: while the piano has focus (`root`), or
   * anywhere on the page except in editable elements (`window`).
   * @default 'root'
   */
  keyboardShortcutsScope?: KeyboardShortcutsScope
  /**
   * Follow the width of the parent element, deriving the width of a white
   * key from it. `whiteKeyWidth` is ignored.
   * @default false
   */
  resizable?: boolean
  /**
   * Width of a white key in pixels, not counting `keyGap`.
   * @default 40
   */
  whiteKeyWidth?: number
  /**
   * Space between two white keys, in pixels.
   * @default 1
   */
  keyGap?: number
  /**
   * Width of a black key, as a fraction of `whiteKeyWidth`.
   * @default 0.65
   */
  blackKeyWidthRatio?: number
  /**
   * Height of a black key, as a fraction of the height of the keyboard.
   * @default 0.6
   */
  blackKeyHeightRatio?: number
  /**
   * What to draw inside a key, as a snippet taking the note and its state.
   * Draw nothing to leave the key bare.
   */
  label?: Snippet<[number, KeyState]>
  /**
   * Extra attributes for one key, by note: a class, a style, a `data-*`
   * attribute to select on. The geometry of the key is applied after the
   * returned style and cannot be overridden.
   */
  keyProps?: (note: number, state: KeyState) => KeyAttributes
  /** Called when a note starts sounding. */
  onPlayNote?: (note: number, velocity?: number) => void
  /** Called once everything holding a note has let go of it. */
  onStopNote?: (note: number) => void
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
}
