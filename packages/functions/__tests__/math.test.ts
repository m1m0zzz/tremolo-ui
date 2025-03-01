import {
  clamp,
  normalizeValue,
  rawValue,
  skewWithCenterValue,
  stepValue,
  decimalPart,
  integerPart,
} from '../src/math'

describe('unit', () => {
  test('clamp()', () => {
    expect(clamp(12, 0, 100)).toBe(12)
    expect(clamp(-50, 0, 100)).toBe(0)
    expect(clamp(123, 0, 100)).toBe(100)
  })

  test('normalizeValue()', () => {
    expect(normalizeValue(34, 0, 100)).toBe(0.34)
    expect(normalizeValue(0, -10, 10)).toBe(0.5)
    expect(normalizeValue(-1.6, -2.3, -1.6)).toBe(1)
    expect(normalizeValue(-2.3, -2.3, -1.6)).toBe(0)
    expect(normalizeValue(10e-4, Math.E, Math.PI)).toBe(0)
    expect(normalizeValue(1_000_000_000, Math.E, Math.PI)).toBe(1)

    let skew = skewWithCenterValue(2000, 20, 20_000)
    expect(normalizeValue(2000, 20, 20_000, skew)).toBe(0.5)
    skew = skewWithCenterValue(-10, -100, 0)
    expect(normalizeValue(-10, -100, 0, skew)).toBe(0.5)
  })

  test('rawValue()', () => {
    expect(stepValue(rawValue(0.34, 0, 100), 1)).toBe(34)
    expect(
      stepValue(rawValue(normalizeValue(Math.PI, 0, 100), 0, 100), 10e-7),
    ).toBe(3.141593) // 3.1415927...

    // TODO: skewed raw value
  })

  test('stepValue()', () => {
    expect(() => {
      expect(stepValue(3.14, 0))
    }).toThrow(RangeError)
    expect(stepValue(3.14, 1)).toBe(3)
    expect(stepValue(3.14, 10)).toBe(0)
    expect(stepValue(3.14, 0.1)).toBe(3.1)
    expect(stepValue(3.14, 0.01)).toBe(3.14)
    expect(stepValue(3.18, 0.1)).toBe(3.2)
    expect(stepValue(3.14, 0.3)).toBe(3.0)
    expect(stepValue(3.15, 0.3)).toBe(3.3)
    expect(stepValue(5.9, 4)).toBe(4)
    expect(stepValue(6, 4)).toBe(8)
    expect(stepValue(-2.3675323105127717, 0.1)).toBe(-2.4)
  })

  test('skewWithCenterValue()', () => {
    const skew = skewWithCenterValue(100, 10, 1000)
    expect(stepValue(rawValue(0.5, 10, 1000, skew), 1)).toBe(100)
  })

  test('decimalPart', () => {
    expect(decimalPart(3.14)).toBe('14')
    expect(decimalPart('3.14')).toBe('14')
    expect(decimalPart('-3.14')).toBe('14')
    expect(decimalPart('3')).toBe(undefined)
    expect(decimalPart(3.0)).toBe(undefined)
    expect(decimalPart('3.00')).toBe('00')
    expect(decimalPart(NaN)).toBe(undefined)
    expect(decimalPart(Infinity)).toBe(undefined)
    expect(decimalPart(-Infinity)).toBe(undefined)
  })

  test('integerPart', () => {
    expect(integerPart(3.14)).toBe('3')
    expect(integerPart(-Math.PI)).toBe('-3')
    expect(integerPart(100)).toBe('100')
    expect(integerPart(0.123)).toBe('0')
    expect(integerPart(NaN)).toBe(undefined)
    expect(integerPart(Infinity)).toBe('Infinity')
    expect(integerPart(-Infinity)).toBe('-Infinity')
  })
})
