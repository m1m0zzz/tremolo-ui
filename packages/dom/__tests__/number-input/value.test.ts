import { parseLeadingNumber } from '../../src/number-input/text'
import {
  commitNumberInputText,
  numberInputBounds,
  numberInputRanges,
  nudgeNumberInput,
} from '../../src/number-input/value'

describe('numberInputRanges', () => {
  test('uses the ends that are set', () => {
    const { normalized, raw } = numberInputRanges({ min: 0, max: 10, step: 1 })
    expect(normalized).toMatchObject({ min: 0, max: 10, step: 1 })
    expect(raw).toMatchObject({ min: 0, max: 10, step: 1 })
  })

  test('fills an open end: safe integers when normalized, any number when raw', () => {
    const { normalized, raw } = numberInputRanges({ min: 0 })
    expect(normalized.max).toBe(Number.MAX_SAFE_INTEGER)
    expect(raw.max).toBe(Number.MAX_VALUE)
  })

  test('opens both ends without clamping', () => {
    const { raw } = numberInputRanges({ min: 0, max: 10, clampValue: false })
    expect(raw).toMatchObject({ min: -Number.MAX_VALUE, max: Number.MAX_VALUE })
  })
})

test('nudgeNumberInput moves a raw amount past the safe-integer range', () => {
  const ranges = numberInputRanges({})
  const next = nudgeNumberInput(0, 1, ['raw', 1e20], ranges)
  expect(next).toBeGreaterThan(Number.MAX_SAFE_INTEGER)
})

test('nudgeNumberInput moves a normalized amount by a share of the range', () => {
  const ranges = numberInputRanges({ min: 0, max: 200 })
  expect(nudgeNumberInput(100, 1, ['normalized', 0.1], ranges)).toBe(120)
})

describe('numberInputBounds', () => {
  test('at the ends', () => {
    expect(numberInputBounds(0, { min: 0, max: 10 })).toEqual({
      atMin: true,
      atMax: false,
      outOfRange: false,
    })
    expect(numberInputBounds(10, { min: 0, max: 10 }).atMax).toBe(true)
  })

  test('an unclamped input is never at an end, but can be out of range', () => {
    expect(
      numberInputBounds(20, { min: 0, max: 10, clampValue: false }),
    ).toEqual({ atMin: false, atMax: false, outOfRange: true })
  })
})

describe('commitNumberInputText', () => {
  test('clamps what was typed', () => {
    const opts = { min: 0, max: 100 }
    expect(commitNumberInputText('1500', parseLeadingNumber, opts)).toBe(100)
    expect(commitNumberInputText('-5 Hz', parseLeadingNumber, opts)).toBe(0)
    expect(commitNumberInputText('42', parseLeadingNumber, opts)).toBe(42)
  })

  test('leaves it alone without clamping', () => {
    expect(
      commitNumberInputText('1500', parseLeadingNumber, {
        max: 100,
        clampValue: false,
      }),
    ).toBe(1500)
  })

  test('text with no number commits nothing', () => {
    expect(commitNumberInputText('Hz', parseLeadingNumber, {})).toBeNull()
  })
})
