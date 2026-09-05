import { applyDelta, skewScale } from '../src/scales'

describe('applyDelta()', () => {
  const range = { min: 0, max: 100, step: 1 }

  test('raw mode adds the option amount', () => {
    expect(applyDelta(50, 1, ['raw', 1], range)).toBe(51)
    expect(applyDelta(50, -1, ['raw', 1], range)).toBe(49)
    expect(applyDelta(50, 1, ['raw', 10], range)).toBe(60)
    // direction carries how many times the option applies
    expect(applyDelta(50, 3, ['raw', 2], range)).toBe(56)
  })

  test('normalized mode moves a fraction of the range', () => {
    expect(applyDelta(50, 1, ['normalized', 0.1], range)).toBe(60)
    expect(applyDelta(50, -1, ['normalized', 0.1], range)).toBe(40)
    expect(applyDelta(0, 1, ['normalized', 0.25], { min: 0, max: 8 })).toBe(2)
  })

  test('min of 0 is a valid range', () => {
    // A truthiness check on min used to reject this, see plan 6.4.
    expect(applyDelta(5, 1, ['normalized', 0.1], range)).toBe(15)
    expect(applyDelta(5, 1, ['raw', 1], range)).toBe(6)
  })

  test('clamps to the range', () => {
    expect(applyDelta(100, 1, ['raw', 5], range)).toBe(100)
    expect(applyDelta(0, -1, ['raw', 5], range)).toBe(0)
    expect(applyDelta(98, 1, ['normalized', 0.5], range)).toBe(100)
  })

  test('rounds to the step', () => {
    expect(applyDelta(0, 1, ['raw', 1], { min: 0, max: 100, step: 10 })).toBe(0)
    expect(applyDelta(0, 1, ['raw', 6], { min: 0, max: 100, step: 10 })).toBe(
      10,
    )
    expect(
      applyDelta(0.5, 1, ['raw', 0.1], { min: 0, max: 1, step: 0.25 }),
    ).toBe(0.5)
  })

  test('leaves the value unrounded when step is omitted', () => {
    expect(applyDelta(0.5, 1, ['raw', 0.03], { min: 0, max: 1 })).toBe(0.53)
  })

  test('applies the scale in normalized mode', () => {
    const skewed = { min: 0, max: 100, scale: skewScale(2) }
    // normalizeValue(25, 0, 100, 2) === 0.0625, +0.1875 => 0.25 => rawValue 50
    expect(applyDelta(25, 1, ['normalized', 0.1875], skewed)).toBeCloseTo(50)
    // raw mode ignores the scale
    expect(applyDelta(25, 1, ['raw', 10], skewed)).toBe(35)
  })
})
