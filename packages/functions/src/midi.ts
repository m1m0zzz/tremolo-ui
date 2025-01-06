import { mod } from './util'

export const whiteNoteNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
export type WhiteNoteName = typeof whiteNoteNames[number]

export const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'] as const
export type NoteName = typeof noteNames[number]

export function parseNoteName(noteName: string) {
  const m = noteName.match(/^([a-g])(#{0,2}|b{0,2})(-?\d+)$/i)
  if (!m) throw new Error('Invalid note name')
  const [, letter, accidental, octave] = m
  return {
    letter: letter.toLocaleUpperCase() as WhiteNoteName,
    accidental: accidental as '#' | '##' | 'b' | 'bb' | '',
    octave: Number(octave),
  }
}

export function noteNumber(noteName: string) {
  const {
    letter,
    accidental,
    octave,
  } = parseNoteName(noteName)
  const noteIndex = noteNames.indexOf(letter.toLocaleUpperCase() as NoteName)
  const accidentalValue = (accidental[0] == 'b' ? -1 : 1) * accidental.length
  return noteIndex - 3 + 12 * (Number(octave) + 1) + accidentalValue
}

export function noteName(noteNumber: number) {
  const noteIndex = mod((noteNumber + 3), 12)
  const octave = Math.floor((noteNumber + 3) / 12) - 1
  return noteNames[noteIndex] + octave
}

export function isNatural(noteNumber: number) {
  return (
    mod(noteNumber, 12) == 0 ||
    mod(noteNumber, 12) == 2 ||
    mod(noteNumber, 12) == 4 ||
    mod(noteNumber, 12) == 5 || 
    mod(noteNumber, 12) == 7 || 
    mod(noteNumber, 12) == 9 || 
    mod(noteNumber, 12) == 11
  )
}
