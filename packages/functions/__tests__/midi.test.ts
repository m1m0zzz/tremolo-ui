import {
  inScale,
  noteNumber,
  noteName,
  noteToFrequency,
  scaleIntervals,
  scaleNotes,
} from '../src/midi'

describe('unit test', () => {
  test('noteNumber()', () => {
    expect(noteNumber('Cbb4')).toBe(58)
    expect(noteNumber('Cb4')).toBe(59)
    expect(noteNumber('C4')).toBe(60)
    expect(noteNumber('C#4')).toBe(61)
    expect(noteNumber('D4')).toBe(62)
    expect(noteNumber('D#4')).toBe(63)
    expect(noteNumber('E4')).toBe(64)
    expect(noteNumber('F4')).toBe(65)
    expect(noteNumber('F#4')).toBe(66)
    expect(noteNumber('G4')).toBe(67)
    expect(noteNumber('G#4')).toBe(68)
    expect(noteNumber('A4')).toBe(69)
    expect(noteNumber('A#4')).toBe(70)
    expect(noteNumber('B4')).toBe(71)
    expect(noteNumber('Bbb4')).toBe(69)
    expect(noteNumber('A##4')).toBe(71)
    expect(noteNumber('C5')).toBe(72)
    expect(noteNumber('C0')).toBe(12)
    expect(noteNumber('C-1')).toBe(0)
    expect(noteNumber('G9')).toBe(127)
    expect(noteNumber('C-2')).toBe(-12)
  })

  test('noteName()', () => {
    expect(noteName(60)).toBe('C4')
    expect(noteName(61)).toBe('C#4')
    expect(noteName(62)).toBe('D4')
    expect(noteName(63)).toBe('D#4')
    expect(noteName(64)).toBe('E4')
    expect(noteName(65)).toBe('F4')
    expect(noteName(66)).toBe('F#4')
    expect(noteName(67)).toBe('G4')
    expect(noteName(68)).toBe('G#4')
    expect(noteName(69)).toBe('A4')
    expect(noteName(70)).toBe('A#4')
    expect(noteName(71)).toBe('B4')
    expect(noteName(72)).toBe('C5')
    expect(noteName(12)).toBe('C0')
    expect(noteName(0)).toBe('C-1')
    expect(noteName(-12)).toBe('C-2')
  })

  test('noteToFrequency()', () => {
    expect(noteToFrequency('A4')).toBe(440)
    expect(noteToFrequency(noteNumber('A4'))).toBe(440)
    expect(noteToFrequency('A4', 0, 332)).toBe(332)
    expect(noteToFrequency('C4').toFixed(2)).toBe('261.63')

    expect(noteToFrequency('A4', 0)).toBe(440)
    expect(noteToFrequency('A4', 1200)).toBe(880)
    expect(noteToFrequency('C3', 100)).toBe(noteToFrequency('C#3'))
  })

  test('scaleIntervals', () => {
    // A scale is a set of pitch classes: ascending, starting at the root and
    // staying inside one octave.
    for (const [name, intervals] of Object.entries(scaleIntervals)) {
      expect([name, intervals[0]]).toEqual([name, 0])
      expect([name, intervals.at(-1)! < 12]).toEqual([name, true])
      expect([name, [...intervals].sort((a, b) => a - b)]).toEqual([
        name,
        [...intervals],
      ])
      expect([name, new Set(intervals).size]).toEqual([name, intervals.length])
    }

    // The two spellings of the same sets.
    expect(scaleIntervals.ionian).toEqual(scaleIntervals.major)
    expect(scaleIntervals.aeolian).toEqual(scaleIntervals.naturalMinor)
  })

  test('inScale()', () => {
    // C major: the white keys.
    expect(inScale('C4', 'C4', 'major')).toBe(true)
    expect(inScale('C#4', 'C4', 'major')).toBe(false)
    expect(inScale('B4', 'C4', 'major')).toBe(true)

    // Octave independent, in both directions.
    expect(inScale('F#4', 'D3', 'major')).toBe(true)
    expect(inScale('F#1', 'D3', 'major')).toBe(true)
    expect(inScale('F4', 'D3', 'major')).toBe(false)

    // noteNumber and noteName are interchangeable.
    expect(inScale(noteNumber('F#4'), noteNumber('D3'), 'major')).toBe(true)

    expect(inScale('Eb3', 'C3', 'naturalMinor')).toBe(true)
    expect(inScale('B3', 'C3', 'naturalMinor')).toBe(false)
    expect(inScale('B3', 'C3', 'harmonicMinor')).toBe(true)

    // Every note is in the chromatic scale, none is missing from it.
    for (let note = 0; note < 12; note++) {
      expect(inScale(note, 0, 'chromatic')).toBe(true)
    }
  })

  test('scaleNotes()', () => {
    expect(scaleNotes('C3', 'majorPentatonic')).toEqual([48, 50, 52, 55, 57])
    expect(scaleNotes(noteNumber('C3'), 'majorPentatonic')).toEqual([
      48, 50, 52, 55, 57,
    ])

    // The octave above the root is left out, so octaves concatenate without
    // repeating a note.
    expect(scaleNotes('C3', 'major')).toEqual([48, 50, 52, 53, 55, 57, 59])
    expect(scaleNotes('C3', 'major', 2)).toEqual([
      ...scaleNotes('C3', 'major'),
      ...scaleNotes('C4', 'major'),
    ])

    expect(scaleNotes('C3', 'major', 0)).toEqual([])

    // What scaleNotes produces is what inScale accepts.
    for (const note of scaleNotes('D3', 'blues', 3)) {
      expect(inScale(note, 'D3', 'blues')).toBe(true)
    }
  })
})
