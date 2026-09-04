import { formatValue, parseValue, selectUnit, Units } from '../src/unit'

const hzUnits: Units = [
  ['Hz', 1],
  ['kHz', 1000],
]

describe('selectUnit()', () => {
  test('picks the largest unit that does not exceed the value', () => {
    expect(selectUnit(hzUnits, 100)).toStrictEqual(['Hz', 1])
    expect(selectUnit(hzUnits, 999)).toStrictEqual(['Hz', 1])
    expect(selectUnit(hzUnits, 1000)).toStrictEqual(['kHz', 1000])
    expect(selectUnit(hzUnits, 1001)).toStrictEqual(['kHz', 1000])
  })

  test('compares magnitudes, so negatives behave like positives', () => {
    expect(selectUnit(hzUnits, -100)).toStrictEqual(['Hz', 1])
    expect(selectUnit(hzUnits, -1000)).toStrictEqual(['kHz', 1000])
  })
})

describe('formatValue()', () => {
  test('without units', () => {
    expect(formatValue(1234)).toBe('1234')
    expect(formatValue(0)).toBe('0')
  })

  test('with a single unit', () => {
    expect(formatValue(1.23, 'Hz')).toBe('1.23Hz')
    expect(formatValue(1.2, 'Hz', 0)).toBe('1Hz')
    expect(formatValue(1.23, 'Hz', 1)).toBe('1.2Hz')
    expect(formatValue(10, 'Hz', 2)).toBe('10.00Hz')
  })

  test('with a unit list, scales to the chosen unit', () => {
    expect(formatValue(10, hzUnits, 0)).toBe('10Hz')
    expect(formatValue(1234, hzUnits, 0)).toBe('1kHz')
    expect(formatValue(1234, hzUnits, 1)).toBe('1.2kHz')
    expect(formatValue(1234, hzUnits, 4)).toBe('1.2340kHz')
    expect(formatValue(0, hzUnits, 4)).toBe('0.0000Hz')
  })
})

describe('parseValue()', () => {
  test('without units, takes the first number found', () => {
    expect(parseValue('1234')).toBe(1234)
    expect(parseValue('3.')).toBe(3)
    expect(parseValue('')).toBe(0)
    expect(parseValue('aaaa')).toBe(0)
    expect(parseValue('4aaaa')).toBe(4)
    expect(parseValue('-12.5')).toBe(-12.5)
  })

  test('with a single unit, the unit is not required', () => {
    expect(parseValue('1.23', 'Hz')).toBe(1.23)
    expect(parseValue('4aaaa', 'Hz')).toBe(4)
  })

  test('with a unit list, the unit decides the scale', () => {
    expect(parseValue('1234', hzUnits)).toBe(1234)
    expect(parseValue('1234Hz', hzUnits)).toBe(1234)
    expect(parseValue('1.23kHz', hzUnits)).toBe(1230)
    expect(parseValue('1.23 kHz', hzUnits)).toBe(1230)
    // an unknown unit is ignored rather than rescaled
    expect(parseValue('12mHz', hzUnits)).toBe(12)
  })

  test('with a unit list, text that is not a bare number reads as 0', () => {
    expect(parseValue('', hzUnits)).toBe(0)
    expect(parseValue('aaaa', hzUnits)).toBe(0)
    expect(parseValue('4aaaa!', hzUnits)).toBe(0)
  })

  test('round trips with formatValue', () => {
    for (const v of [0, 1, 999, 1000, 1234, -5000]) {
      expect(parseValue(formatValue(v, hzUnits, 4), hzUnits)).toBeCloseTo(v)
    }
  })
})
