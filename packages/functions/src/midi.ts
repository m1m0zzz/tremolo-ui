import { mod } from './util'

export const whiteKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

export type WhiteKey = (typeof whiteKeys)[number]

export const noteKeys = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

export type NoteKey = (typeof noteKeys)[number]

export function parseNoteName(noteName: string) {
  const m = noteName.match(/^([a-g])(#{0,2}|b{0,2})(-?\d+)$/i)
  if (!m) throw new Error('Invalid note name')
  const [, letter, accidental, octave] = m
  return {
    letter: letter.toLocaleUpperCase() as WhiteKey,
    accidental: accidental as '#' | '##' | 'b' | 'bb' | '',
    octave: Number(octave),
  }
}

/**
 * Convert noteName to noteNumber
 */
export function noteNumber(noteName: string) {
  const { letter, accidental, octave } = parseNoteName(noteName)
  const noteIndex = noteKeys.indexOf(letter.toLocaleUpperCase() as NoteKey)
  const accidentalValue = (accidental[0] === 'b' ? -1 : 1) * accidental.length
  return noteIndex + 12 * (Number(octave) + 1) + accidentalValue
}

/**
 * Convert noteNumber to noteName
 * C-1 = 0
 * G9 = 127
 * @param noteNumber noteNumber
 */
export function noteName(noteNumber: number): `${NoteKey}${number}` {
  const noteIndex = mod(noteNumber, 12)
  const octave = Math.floor(noteNumber / 12) - 1
  return `${noteKeys[noteIndex]}${octave}`
}

/**
 * Convert noteNumber to noteKey
 */
export function noteKey(noteNumber: number): NoteKey {
  return noteKeys[mod(noteNumber, 12)]
}

/**
 * @param note noteNumber: 0 ~ 127 or noteName e.g. 'C3'
 */
export function isWhiteKey(note: number | string) {
  const n = typeof note === 'string' ? noteNumber(note) : note
  return (
    mod(n, 12) === 0 ||
    mod(n, 12) === 2 ||
    mod(n, 12) === 4 ||
    mod(n, 12) === 5 ||
    mod(n, 12) === 7 ||
    mod(n, 12) === 9 ||
    mod(n, 12) === 11
  )
}

/**
 * @param note noteNumber: 0 ~ 127 or noteName e.g. 'C3'
 */
export function isBlackKey(note: number | string) {
  return !isWhiteKey(note)
}

/**
 * @param note noteNumber: 0 ~ 127 or noteName e.g. 'C3'
 * @param detune [cent]
 * @param a4 A4 frequency [Hz]
 * @returns frequency [Hz]
 */
export function noteToFrequency(note: number | string, detune = 0, a4 = 440) {
  const n = typeof note === 'string' ? noteNumber(note) : note
  return (a4 / 32) * 2 ** ((n - 9 + detune / 100) / 12)
}

/**
 * Semitones above the root, for each supported scale.
 *
 * Every entry starts at 0 and stays inside one octave, so a scale is a set of
 * pitch classes rather than a set of notes: {@link inScale} compares against
 * it with the octave taken out.
 *
 * `ionian` and `aeolian` are the same sets as `major` and `naturalMinor`; both
 * spellings are here because both are what someone reaches for depending on
 * whether they are thinking in keys or in modes.
 */
export const scaleIntervals = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],

  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],

  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],

  wholeTone: [0, 2, 4, 6, 8, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
} as const satisfies Record<string, readonly number[]>

export type ScaleName = keyof typeof scaleIntervals

/**
 * Whether a note belongs to a scale, regardless of the octave either sits in.
 *
 * @param note noteNumber: 0 ~ 127 or noteName e.g. 'C3'
 * @param root the note the scale is built on, in the same two forms
 *
 * @example
 * ```ts
 * inScale('F#4', 'D3', 'major') // true
 * ```
 */
export function inScale(
  note: number | string,
  root: number | string,
  name: ScaleName,
): boolean {
  const n = typeof note === 'string' ? noteNumber(note) : note
  const r = typeof root === 'string' ? noteNumber(root) : root
  return (scaleIntervals[name] as readonly number[]).includes(mod(n - r, 12))
}

/**
 * The notes of a scale, ascending from `root`.
 *
 * The octave above the root is not included: ask for more `octaves` instead, so
 * that concatenating the result of two calls does not repeat a note.
 *
 * @param root noteNumber: 0 ~ 127 or noteName e.g. 'C3'
 * @param octaves how many octaves to cover
 *
 * @example
 * ```ts
 * scaleNotes('C3', 'majorPentatonic') // [48, 50, 52, 55, 57]
 * ```
 */
export function scaleNotes(
  root: number | string,
  name: ScaleName,
  octaves = 1,
): number[] {
  const r = typeof root === 'string' ? noteNumber(root) : root
  const intervals = scaleIntervals[name] as readonly number[]
  return Array.from({ length: octaves }, (_, octave) =>
    intervals.map((interval) => r + octave * 12 + interval),
  ).flat()
}
