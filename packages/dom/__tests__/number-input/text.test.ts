import {
  caretAtDecimalOffset,
  caretDecimalOffset,
  numberSpan,
  parseNumberText,
} from '../../src/number-input/text'

describe('numberSpan', () => {
  const number = (text: string) => {
    const span = numberSpan(text)
    return span && text.slice(span.start, span.end)
  }

  test('leaves out the unit, with or without a space', () => {
    expect(number('440 Hz')).toBe('440')
    expect(number('440Hz')).toBe('440')
    expect(number('50%')).toBe('50')
    expect(number('  440 Hz  ')).toBe('440')
  })

  test('takes the sign and the decimal point in front', () => {
    expect(number('-6.0 dB')).toBe('-6.0')
    expect(number('+6.0dB')).toBe('+6.0')
    expect(number('\u22126.0 dB')).toBe('\u22126.0')
    expect(number('.5')).toBe('.5')
    expect(number('-.5')).toBe('-.5')
  })

  test('covers the whole number, however it is written', () => {
    expect(number('1e+21')).toBe('1e+21')
    expect(number('1.5e-7 s')).toBe('1.5e-7')
    expect(number('1,000 Hz')).toBe('1,000')
    expect(number('1:30')).toBe('1:30')
  })

  test('a unit in front is left out too', () => {
    expect(numberSpan('L 30')).toEqual({ start: 2, end: 4 })
    expect(numberSpan('L30')).toEqual({ start: 1, end: 3 })
  })

  test('a unit starting with e is not an exponent', () => {
    expect(number('5em')).toBe('5')
  })

  test('text without a digit has none', () => {
    expect(numberSpan('')).toBeNull()
    expect(numberSpan('-\u221e dB')).toBeNull()
    expect(numberSpan('off')).toBeNull()
  })
})

describe('parseNumberText', () => {
  test('reads the number in front of a unit', () => {
    expect(parseNumberText('440 Hz')).toBe(440)
    expect(parseNumberText('440Hz')).toBe(440)
    expect(parseNumberText(' -6.5dB')).toBe(-6.5)
    expect(parseNumberText('+6.0 dB')).toBe(6)
    expect(parseNumberText('\u22126.0 dB')).toBe(-6)
    expect(parseNumberText('.5')).toBe(0.5)
    expect(parseNumberText('1e3')).toBe(1000)
    expect(parseNumberText('1e+21Hz')).toBe(1e21)
    expect(parseNumberText('5em')).toBe(5)
  })

  test('reads a half-typed entry', () => {
    expect(parseNumberText('1.')).toBe(1)
    expect(parseNumberText('1e')).toBe(1)
  })

  test('text without a number is NaN, not 0', () => {
    expect(parseNumberText('')).toBeNaN()
    expect(parseNumberText('Hz')).toBeNaN()
    expect(parseNumberText('-')).toBeNaN()
  })

  test('a number it cannot read whole is NaN, not a part of it', () => {
    expect(parseNumberText('1,000 Hz')).toBeNaN()
    expect(parseNumberText('1:30')).toBeNaN()
    expect(parseNumberText('5 6')).toBeNaN()
  })

  test('something in front of the number is NaN', () => {
    // It can change the meaning: the L of a pan is a negative value.
    expect(parseNumberText('L 30')).toBeNaN()
    expect(parseNumberText('A4')).toBeNaN()
  })
})

describe('the caret stays at the same digit', () => {
  const step = (from: string, caret: number, to: string) =>
    caretAtDecimalOffset(to, caretDecimalOffset(from, caret))

  test('when a digit is gained in front', () => {
    // 9|.9 -> 10|.0
    expect(step('9.9', 1, '10.0')).toBe(2)
    // 9.|9 -> 10.|0
    expect(step('9.9', 2, '10.0')).toBe(3)
  })

  test('when a digit is lost in front', () => {
    // 10| -> 9|
    expect(step('10', 2, '9')).toBe(1)
  })

  test('without a decimal point, and around a unit', () => {
    // 1|00 Hz -> 1|01 Hz
    expect(step('100 Hz', 1, '101 Hz')).toBe(1)
  })

  test('kept within the number', () => {
    // A caret in the unit comes back to the end of the number.
    expect(step('100 Hz', 5, '101 Hz')).toBe(3)
    expect(step('100', 0, '1')).toBe(0)
  })

  test('with a sign, an exponent or a unit in front', () => {
    // +6|.0 dB -> +7|.0 dB
    expect(step('+6.0 dB', 2, '+7.0 dB')).toBe(2)
    // 1|e+21 -> 2|e+21
    expect(step('1e+21', 1, '2e+21')).toBe(1)
    // L 3|0 -> L 3|1, and never into the L
    expect(step('L 30', 3, 'L 31')).toBe(3)
    expect(step('L 30', 0, 'L 31')).toBe(2)
  })
})
