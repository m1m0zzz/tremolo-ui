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

/**
 * Where keyboard shortcuts listen. `root` handles keys only while the piano
 * or one of its descendants has focus; `window` handles them anywhere on the
 * page except in editable elements.
 */
export type KeyboardShortcutsScope = 'root' | 'window'

/**
 * Whether a key press was typed into something: shortcuts must not play a
 * note for a letter that is going into a text field.
 */
export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.matches('input, textarea, select')) return true

  for (let element: HTMLElement | null = target; element;) {
    const contentEditable = element.getAttribute('contenteditable')
    if (contentEditable !== null)
      return contentEditable.toLowerCase() !== 'false'
    element = element.parentElement
  }

  return false
}
