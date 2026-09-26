import {
  caretAtDecimalOffset,
  caretDecimalOffset,
  leadingNumberLength,
  parseLeadingNumber,
} from '../../src/number-input/text'

describe('parseLeadingNumber', () => {
  test('reads the number in front of a unit', () => {
    expect(parseLeadingNumber('440 Hz')).toBe(440)
    expect(parseLeadingNumber(' -6.5dB')).toBe(-6.5)
    expect(parseLeadingNumber('.5')).toBe(0.5)
    expect(parseLeadingNumber('1e3')).toBe(1000)
  })

  test('text without a number is NaN, not 0', () => {
    expect(parseLeadingNumber('')).toBeNaN()
    expect(parseLeadingNumber('Hz')).toBeNaN()
    expect(parseLeadingNumber('-')).toBeNaN()
  })
})

test('leadingNumberLength covers the number and nothing after it', () => {
  expect(leadingNumberLength('440 Hz')).toBe(3)
  expect(leadingNumberLength(' -1,000.5 Hz')).toBe(9)
  expect(leadingNumberLength('Hz')).toBe(0)
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
})
