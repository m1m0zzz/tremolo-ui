export type KeyboardShortcuts = {
  /**
   * Keys laid out from `noteRange.first`, one entry per semitone.
   *
   * An empty string leaves that note without a shortcut: `KeyboardEvent.key` is
   * never empty, so the entry can never match. Use it to skip the black keys
   * (see {@link SHORTCUTS.HOME_ROW_NATURAL}) and keep the remaining entries
   * lined up with the notes.
   */
  keys: string[]
}

/**
 * Ready-made keyboard layouts. Both assume `noteRange.first` is a C.
 */
export const SHORTCUTS = {
  /** Every semitone from C, over the two rows of a QWERTY keyboard. */
  HOME_ROW: {
    keys: [
      'a',
      'w',
      's',
      'e',
      'd',
      'f',
      't',
      'g',
      'y',
      'h',
      'u',
      'j',
      'k',
      'o',
      'l',
      'p',
      ';',
    ],
  },
  /** The white keys only, on the home row. Black keys have no shortcut. */
  HOME_ROW_NATURAL: {
    keys: [
      'a',
      '',
      's',
      '',
      'd',
      'f',
      '',
      'g',
      '',
      'h',
      '',
      'j',
      'k',
      '',
      'l',
      '',
      ';',
    ],
  },
}
