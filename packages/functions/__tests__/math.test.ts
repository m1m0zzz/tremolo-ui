import {
  clamp,
  dbToGain,
  decimalPart,
  degree,
  gainToDb,
  integerPart,
  mapValue,
  normalizeValue,
  radian,
  rawValue,
  stepValue,
  toFixed,
  toPrecision,
} from '../src/math'
import { isEmpty, mod, xor } from '../src/util'

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
    expect(() => normalizeValue(1, 10, 10)).toThrow(RangeError)
  })

  test('rawValue()', () => {
    expect(stepValue(rawValue(0.34, 0, 100), 1)).toBe(34)
    expect(
      stepValue(rawValue(normalizeValue(Math.PI, 0, 100), 0, 100), 10e-7),
    ).toBe(3.141593) // 3.1415927...

    // The curve belongs to a Scale; these two are the linear mapping only.
    expect(rawValue(-0.5, 0, 100)).toBe(0)
    expect(rawValue(1.5, 0, 100)).toBe(100)
    expect(() => rawValue(0.5, 10, 10)).toThrow(RangeError)
  })

  test('stepValue()', () => {
    expect(() => stepValue(3.14, 0)).toThrow(RangeError)
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

    // A half step goes up, whichever side the division error falls on.
    expect(stepValue(0.15, 0.1)).toBe(0.2)
    expect(stepValue(0.25, 0.1)).toBe(0.3)
    expect(stepValue(0.35, 0.1)).toBe(0.4)
    expect(stepValue(-0.15, 0.1)).toBe(-0.1)

    // A step small enough to print in exponential notation has no decimal
    // part to read digits from, which used to leave the result rounded to a
    // whole number — every value under half a step collapsed to 0.
    expect(stepValue(1.2e-7, 1e-7)).toBe(1e-7)
    expect(stepValue(1.6e-7, 1e-7)).toBe(2e-7)
    expect(stepValue(2.5e-7, 1e-7)).toBe(3e-7)
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

  test('toPrecision', () => {
    expect(toPrecision(5.1 + 0.1)).toBe(5.2)
    expect(toPrecision(0.1 + 0.2)).toBe(0.3)
    expect(toPrecision(0.0005 / 1e-6)).toBe(500)
    // A value that is already clean comes back untouched.
    expect(toPrecision(5.2)).toBe(5.2)
    expect(toPrecision(1 / 3)).toBe(0.333333333333333)
    expect(toPrecision(-5.699999999999998)).toBe(-5.7)
  })

  test('toPrecision leaves what it has no answer for', () => {
    expect(toPrecision(0)).toBe(0)
    expect(Object.is(toPrecision(-0), -0)).toBe(true)
    expect(toPrecision(NaN)).toBe(NaN)
    expect(toPrecision(Infinity)).toBe(Infinity)
    // Rounding the top of the range up would overflow to Infinity, which is
    // a worse answer than the artefact.
    expect(toPrecision(Number.MAX_VALUE)).toBe(Number.MAX_VALUE)
  })

  test('toPrecision does not accumulate', () => {
    let raw = 0
    let clean = 0
    for (let i = 0; i < 1000; i++) {
      raw = raw + 0.1
      clean = toPrecision(clean + 0.1)
    }
    expect(raw).not.toBe(100)
    expect(clean).toBe(100)
  })

  test('the public numeric conversions have known values and round-trip', () => {
    expect(toFixed(Math.PI, 2)).toBe(3.14)
    expect(radian(180)).toBeCloseTo(Math.PI)
    expect(degree(Math.PI)).toBeCloseTo(180)
    expect(degree(radian(37))).toBeCloseTo(37)
    expect(mapValue(0.25, 0, 1, 100, 0)).toBe(75)
    expect(dbToGain(0)).toBe(1)
    expect(gainToDb(1)).toBe(0)
    expect(gainToDb(dbToGain(-18))).toBeCloseTo(-18)
  })

  test('utility helpers keep their public contracts', () => {
    expect(mod(-13, 12)).toBe(11)
    expect(mod(-12, 12)).toBe(0)
    expect(isEmpty({})).toBe(true)
    expect(isEmpty({ inherited: undefined })).toBe(false)
    expect([
      xor(false, false),
      xor(false, true),
      xor(true, false),
      xor(true, true),
    ]).toEqual([false, true, true, false])
  })
})
