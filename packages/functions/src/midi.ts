import { mod } from './util'

/**
 * @category MIDI
 */
export const whiteKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

/**
 * @category MIDI
 */
export type WhiteKey = (typeof whiteKeys)[number]

/**
 * @category MIDI
 */
export const noteNames = [
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

/**
 * @category MIDI
 */
export type NoteName = (typeof noteNames)[number]

/**
 * @category MIDI
 */
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
 *
 * @category MIDI
 */
export function noteNumber(noteName: string) {
  const { letter, accidental, octave } = parseNoteName(noteName)
  const noteIndex = noteNames.indexOf(letter.toLocaleUpperCase() as NoteName)
  const accidentalValue = (accidental[0] == 'b' ? -1 : 1) * accidental.length
  return noteIndex + 12 * (Number(octave) + 1) + accidentalValue
}

/**
 *
 * @category MIDI
 */
export function noteName(noteNumber: number) {
  const noteIndex = mod(noteNumber, 12)
  const octave = Math.floor(noteNumber / 12) - 1
  return noteNames[noteIndex] + octave
}

/**
 * @category MIDI
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
 * @category MIDI
 */
export function isBlackKey(noteNumber: number | string) {
  return !isWhiteKey(noteNumber)
}

export const scaleNames = ['major', 'minor', 'natural minor', 'pentatonic']
