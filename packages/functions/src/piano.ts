import { isBlackKey, isWhiteKey, noteKey, noteKeys, type NoteKey } from './midi'

export type NoteRange = {
  first: number
  last: number
}

/**
 * `[noteRange.first, noteRange.first + 1, ..., noteRange.last]`
 */
export function getNoteRangeArray(noteRange: NoteRange): number[] {
  return Array.from(
    { length: noteRange.last - noteRange.first + 1 },
    (_, i) => i + noteRange.first,
  )
}

/**
 * The geometry of a drawn keyboard.
 *
 * One description is shared by the drawing and the hit testing, so a key cannot
 * be drawn somewhere other than where it responds.
 */
export interface PianoLayout {
  noteRange: NoteRange

  /** Width of a white key, excluding {@link PianoLayout.keyGap}. */
  whiteKeyWidth: number

  /**
   * Space between two white keys. Part of the slot a white key occupies, so it
   * still belongs to one of the keys for the purpose of hit testing.
   *
   * @default 1
   */
  keyGap?: number

  /**
   * Width of a black key, as a fraction of {@link PianoLayout.whiteKeyWidth}.
   *
   * @default 0.65
   */
  blackKeyWidthRatio?: number

  /**
   * Height of a black key, as a fraction of the height of the keyboard.
   *
   * @default 0.6
   */
  blackKeyHeightRatio?: number
}

const DEFAULT_KEY_GAP = 1
const DEFAULT_BLACK_KEY_WIDTH_RATIO = 0.65
const DEFAULT_BLACK_KEY_HEIGHT_RATIO = 0.6

/**
 * How many white keys sit at or before each pitch class, counting from C.
 *
 * A black key shares the number of the white key to its left plus one, which
 * puts it on the boundary between the two; {@link notePosition} then shifts it
 * back by half its width to centre it there.
 */
const whiteKeysBefore: Record<NoteKey, number> = {
  C: 0,
  'C#': 1,
  D: 1,
  'D#': 2,
  E: 2,
  F: 3,
  'F#': 4,
  G: 4,
  'G#': 5,
  A: 5,
  'A#': 6,
  B: 6,
}

/** Width of a black key in pixels. */
export function blackKeyWidth(layout: PianoLayout): number {
  return (
    layout.whiteKeyWidth *
    (layout.blackKeyWidthRatio ?? DEFAULT_BLACK_KEY_WIDTH_RATIO)
  )
}

/** Width of the whole keyboard in pixels. */
export function pianoWidth(layout: PianoLayout): number {
  const whiteKeys = getNoteRangeArray(layout.noteRange).filter(isWhiteKey)
  return (
    (layout.whiteKeyWidth + (layout.keyGap ?? DEFAULT_KEY_GAP)) *
    whiteKeys.length
  )
}

/**
 * Offset of the left edge of a key from the left edge of the keyboard, in
 * pixels.
 *
 * Notes outside `noteRange` are placed too, so the value is negative below
 * `noteRange.first`.
 */
export function notePosition(note: number, layout: PianoLayout): number {
  const slot = layout.whiteKeyWidth + (layout.keyGap ?? DEFAULT_KEY_GAP)
  const target = noteKey(note)
  const first = noteKey(layout.noteRange.first)

  const octave = Math.floor((note - layout.noteRange.first) / 12)
  // A note whose pitch class comes before the first one belongs to the octave
  // above the one the division above gives.
  const octaveOffset =
    noteKeys.indexOf(first) > noteKeys.indexOf(target) ? 1 : 0

  const whiteKeysIn =
    whiteKeysBefore[target] -
    whiteKeysBefore[first] +
    (octave + octaveOffset) * 7

  return isBlackKey(note)
    ? whiteKeysIn * slot - blackKeyWidth(layout) / 2
    : whiteKeysIn * slot
}

/**
 * The note drawn at a point, or null where there is none.
 *
 * Black keys are tested first, so they win where they overlap a white one. A
 * white key covers its gap as well as its width, so the whole width of the
 * keyboard belongs to some key and a click cannot fall between two.
 *
 * @param x offset from the left edge of the keyboard, in pixels
 * @param y offset from its top edge, in pixels
 * @param height height of the keyboard, in pixels
 */
export function noteAt(
  x: number,
  y: number,
  height: number,
  layout: PianoLayout,
): number | null {
  if (y < 0 || y >= height) return null

  const notes = getNoteRangeArray(layout.noteRange)
  const blackHeight =
    height * (layout.blackKeyHeightRatio ?? DEFAULT_BLACK_KEY_HEIGHT_RATIO)

  if (y < blackHeight) {
    for (const note of notes) {
      if (isWhiteKey(note)) continue
      const left = notePosition(note, layout)
      if (left <= x && x < left + blackKeyWidth(layout)) return note
    }
  }

  const slot = layout.whiteKeyWidth + (layout.keyGap ?? DEFAULT_KEY_GAP)
  for (const note of notes) {
    if (isBlackKey(note)) continue
    const left = notePosition(note, layout)
    if (left <= x && x < left + slot) return note
  }

  return null
}
