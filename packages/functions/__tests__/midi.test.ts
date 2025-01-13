import {
  noteNumber,
  noteName,
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
})
