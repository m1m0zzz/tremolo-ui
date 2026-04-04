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
  const accidentalValue = (accidental[0] == 'b' ? -1 : 1) * accidental.length
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
  const n = typeof note == 'string' ? noteNumber(note) : note
  return (
    mod(n, 12) == 0 ||
    mod(n, 12) == 2 ||
    mod(n, 12) == 4 ||
    mod(n, 12) == 5 ||
    mod(n, 12) == 7 ||
    mod(n, 12) == 9 ||
    mod(n, 12) == 11
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
  const n = typeof note == 'string' ? noteNumber(note) : note
  return (a4 / 32) * 2 ** ((n - 9 + detune / 100) / 12)
}
