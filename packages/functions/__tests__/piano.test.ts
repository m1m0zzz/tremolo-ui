import { noteNumber } from '../src/midi'
import {
  blackKeyWidth,
  getNoteRangeArray,
  noteAt,
  notePosition,
  pianoWidth,
  type PianoLayout,
} from '../src/piano'

// The defaults of the drawn keyboard: 40px white keys, 1px gap, black keys
// 0.65 as wide and 0.6 as tall.
const layout: PianoLayout = {
  noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
  whiteKeyWidth: 40,
}

const slot = 41
const height = 160

describe('unit test', () => {
  test('getNoteRangeArray()', () => {
    expect(getNoteRangeArray({ first: 60, last: 63 })).toEqual([60, 61, 62, 63])
    expect(getNoteRangeArray({ first: 60, last: 60 })).toEqual([60])
  })

  test('blackKeyWidth()', () => {
    expect(blackKeyWidth(layout)).toBe(26)
    expect(blackKeyWidth({ ...layout, blackKeyWidthRatio: 0.5 })).toBe(20)
  })

  test('pianoWidth()', () => {
    // C3..B4 is two octaves: 14 white keys.
    expect(pianoWidth(layout)).toBe(14 * slot)
    expect(pianoWidth({ ...layout, keyGap: 0 })).toBe(14 * 40)
    // C3..E3 is C D E.
    expect(pianoWidth({ ...layout, noteRange: { first: 48, last: 52 } })).toBe(
      3 * slot,
    )
  })

  test('notePosition() places white keys one slot apart', () => {
    const first = noteNumber('C3')
    expect(notePosition(first, layout)).toBe(0)
    expect(notePosition(noteNumber('D3'), layout)).toBe(slot)
    expect(notePosition(noteNumber('E3'), layout)).toBe(2 * slot)
    expect(notePosition(noteNumber('F3'), layout)).toBe(3 * slot)
    expect(notePosition(noteNumber('B3'), layout)).toBe(6 * slot)
    // One octave up is seven white keys along.
    expect(notePosition(noteNumber('C4'), layout)).toBe(7 * slot)
    expect(notePosition(noteNumber('B4'), layout)).toBe(13 * slot)
  })

  test('notePosition() centres black keys on the boundary', () => {
    // C#3 sits on the C3/D3 boundary, shifted back by half its width.
    expect(notePosition(noteNumber('C#3'), layout)).toBe(slot - 13)
    expect(notePosition(noteNumber('D#3'), layout)).toBe(2 * slot - 13)
    expect(notePosition(noteNumber('A#3'), layout)).toBe(6 * slot - 13)
    expect(notePosition(noteNumber('C#4'), layout)).toBe(8 * slot - 13)
  })

  test('notePosition() works when the range does not start on C', () => {
    // From E3 the white keys are E F G A B C4, so C4 is the sixth.
    const fromE: PianoLayout = {
      ...layout,
      noteRange: { first: noteNumber('E3'), last: noteNumber('E4') },
    }
    expect(notePosition(noteNumber('E3'), fromE)).toBe(0)
    expect(notePosition(noteNumber('F3'), fromE)).toBe(slot)
    expect(notePosition(noteNumber('B3'), fromE)).toBe(4 * slot)
    expect(notePosition(noteNumber('C4'), fromE)).toBe(5 * slot)
    expect(notePosition(noteNumber('E4'), fromE)).toBe(7 * slot)
    expect(notePosition(noteNumber('F#3'), fromE)).toBe(2 * slot - 13)
  })

  test('notePosition() extends below the range', () => {
    // B2 is one white key to the left of C3.
    expect(notePosition(noteNumber('B2'), layout)).toBe(-slot)
    expect(notePosition(noteNumber('C2'), layout)).toBe(-7 * slot)
  })

  test('noteAt() finds white keys', () => {
    expect(noteAt(0, height - 1, height, layout)).toBe(noteNumber('C3'))
    expect(noteAt(5, 150, height, layout)).toBe(noteNumber('C3'))
    expect(noteAt(slot + 5, 150, height, layout)).toBe(noteNumber('D3'))
    expect(noteAt(13 * slot + 5, 150, height, layout)).toBe(noteNumber('B4'))
  })

  test('noteAt() gives black keys the overlap', () => {
    const cSharp = notePosition(noteNumber('C#3'), layout)
    // Inside the black key, above where it ends.
    expect(noteAt(cSharp + 1, 10, height, layout)).toBe(noteNumber('C#3'))
    // Same x, below the bottom of the black key.
    expect(noteAt(cSharp + 1, 150, height, layout)).toBe(noteNumber('C3'))
    // The boundary of the black key is exactly 0.6 of the height.
    expect(noteAt(cSharp + 1, 95, height, layout)).toBe(noteNumber('C#3'))
    expect(noteAt(cSharp + 1, 96, height, layout)).toBe(noteNumber('C3'))
  })

  test('noteAt() leaves no gap between white keys', () => {
    // The 1px gap after C3 belongs to C3, not to nothing.
    expect(noteAt(40, 150, height, layout)).toBe(noteNumber('C3'))
    expect(noteAt(40.5, 150, height, layout)).toBe(noteNumber('C3'))
    expect(noteAt(41, 150, height, layout)).toBe(noteNumber('D3'))

    // Every x across the keyboard hits some key.
    for (let x = 0; x < pianoWidth(layout); x++) {
      expect([x, noteAt(x, 150, height, layout)]).not.toEqual([x, null])
    }
  })

  test('noteAt() returns null outside the keyboard', () => {
    expect(noteAt(-1, 80, height, layout)).toBe(null)
    expect(noteAt(pianoWidth(layout), 80, height, layout)).toBe(null)
    expect(noteAt(5, -1, height, layout)).toBe(null)
    expect(noteAt(5, height, height, layout)).toBe(null)
  })

  test('noteAt() does not report a black key outside the range', () => {
    // A#4 would overlap the right edge of B4, but the range stops at B4.
    const upToB4 = noteAt(13 * slot - 1, 10, height, layout)
    expect(upToB4).toBe(noteNumber('A#4'))

    const upToA4: PianoLayout = {
      ...layout,
      noteRange: { first: noteNumber('C3'), last: noteNumber('A4') },
    }
    expect(noteAt(13 * slot - 1, 10, height, upToA4)).toBe(noteNumber('A4'))
  })
})
