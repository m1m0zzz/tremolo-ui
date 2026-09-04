import {
  curveScale,
  curveWithCenterValue,
  exponentialScale,
  linearScale,
  skewScale,
  skewWithCenterValue,
  symmetricSkewScale,
  type Scale,
} from '../src'

/** Every scale, on a range each of them can take. */
const scales: [name: string, scale: Scale][] = [
  ['linearScale', linearScale],
  ['skewScale(0.5)', skewScale(0.5)],
  ['skewScale(2)', skewScale(2)],
  ['exponentialScale', exponentialScale],
  ['curveScale(4)', curveScale(4)],
  ['curveScale(-4)', curveScale(-4)],
  ['symmetricSkewScale(0.5)', symmetricSkewScale(0.5)],
  ['symmetricSkewScale(2)', symmetricSkewScale(2)],
]

const MIN = 20
const MAX = 22000

describe.each(scales)('%s', (_name, scale) => {
  test('maps the ends of the travel to min and max', () => {
    expect(scale.denormalize(0, MIN, MAX)).toBeCloseTo(MIN, 6)
    expect(scale.denormalize(1, MIN, MAX)).toBeCloseTo(MAX, 6)
    expect(scale.normalize(MIN, MIN, MAX)).toBeCloseTo(0, 6)
    expect(scale.normalize(MAX, MIN, MAX)).toBeCloseTo(1, 6)
  })

  test('normalize and denormalize are inverses', () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const position = Math.min(p, 1)
      const value = scale.denormalize(position, MIN, MAX)
      expect(scale.normalize(value, MIN, MAX)).toBeCloseTo(position, 6)
    }
  })

  test('is monotonically increasing', () => {
    let previous = -Infinity
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const value = scale.denormalize(Math.min(p, 1), MIN, MAX)
      expect(value).toBeGreaterThan(previous)
      previous = value
    }
  })

  test('clamps a position outside 0-1', () => {
    expect(scale.denormalize(-0.5, MIN, MAX)).toBeCloseTo(MIN, 6)
    expect(scale.denormalize(1.5, MIN, MAX)).toBeCloseTo(MAX, 6)
    expect(scale.normalize(MIN - 100, MIN, MAX)).toBeCloseTo(0, 6)
    expect(scale.normalize(MAX + 100, MIN, MAX)).toBeCloseTo(1, 6)
  })

  test('rejects an empty range', () => {
    expect(() => scale.denormalize(0.5, 10, 10)).toThrow(RangeError)
    expect(() => scale.normalize(10, 10, 10)).toThrow(RangeError)
  })
})

describe('linearScale', () => {
  test('splits the range evenly', () => {
    expect(linearScale.denormalize(0.25, 0, 100)).toBeCloseTo(25)
    expect(linearScale.denormalize(0.5, -60, 6)).toBeCloseTo(-27)
    expect(linearScale.normalize(25, 0, 100)).toBeCloseTo(0.25)
  })
})

describe('skewScale', () => {
  test('matches the existing skew behaviour', () => {
    // The curve JUCE's NormalisableRange produces: position^(1/skew).
    const skew = 0.5
    expect(skewScale(skew).denormalize(0.5, 0, 100)).toBeCloseTo(
      Math.pow(0.5, 1 / skew) * 100,
    )
  })

  test('skewWithCenterValue puts the centre at half the travel', () => {
    const scale = skewScale(skewWithCenterValue(663, MIN, MAX))
    expect(scale.denormalize(0.5, MIN, MAX)).toBeCloseTo(663, 6)

    // Moved here from math.test.ts along with skewWithCenterValue itself.
    expect(
      skewScale(skewWithCenterValue(2000, 20, 20_000)).normalize(
        2000,
        20,
        20_000,
      ),
    ).toBe(0.5)
    expect(
      skewScale(skewWithCenterValue(-10, -100, 0)).normalize(-10, -100, 0),
    ).toBe(0.5)
    expect(
      skewScale(skewWithCenterValue(100, 10, 1000)).denormalize(0.5, 10, 1000),
    ).toBeCloseTo(100, 6)
  })

  test('skewWithCenterValue rejects a centre outside the range', () => {
    expect(() => skewWithCenterValue(2000, 20, 1000)).toThrow(RangeError)
  })

  test('skew < 1 gives the lower end more travel', () => {
    // Half the travel reaches only a small part of the range.
    expect(skewScale(0.5).denormalize(0.5, 0, 100)).toBeCloseTo(25)
    expect(skewScale(2).denormalize(0.5, 0, 100)).toBeCloseTo(70.71, 2)
  })
})

describe('exponentialScale', () => {
  test('gives every octave the same amount of travel', () => {
    const octave = (f: number) => exponentialScale.normalize(f, MIN, MAX)
    const first = octave(40) - octave(20)
    for (let f = 40; f <= 10240; f *= 2) {
      expect(octave(f * 2) - octave(f)).toBeCloseTo(first, 6)
    }
  })

  test('the middle of the travel is the geometric mean', () => {
    expect(exponentialScale.denormalize(0.5, MIN, MAX)).toBeCloseTo(
      Math.sqrt(MIN * MAX),
      6,
    )
  })

  test('works on a wholly negative range', () => {
    expect(exponentialScale.denormalize(0.5, -100, -1)).toBeCloseTo(-10, 6)
  })

  test.each([
    ['min is 0', 0, 100],
    ['max is 0', -100, 0],
    ['the range crosses 0', -60, 6],
  ])('rejects a range where %s', (_why, min, max) => {
    expect(() => exponentialScale.denormalize(0.5, min, max)).toThrow(
      RangeError,
    )
    expect(() => exponentialScale.normalize(1, min, max)).toThrow(RangeError)
  })
})

describe('curveScale', () => {
  test('handles a range starting at 0, which exponentialScale cannot', () => {
    const scale = curveScale(4)
    expect(scale.denormalize(0, 0, 5000)).toBeCloseTo(0, 6)
    expect(scale.denormalize(1, 0, 5000)).toBeCloseTo(5000, 6)
  })

  test('handles a range crossing 0', () => {
    const scale = curveScale(-2)
    expect(scale.denormalize(0, -60, 6)).toBeCloseTo(-60, 6)
    expect(scale.denormalize(1, -60, 6)).toBeCloseTo(6, 6)
  })

  test('curve > 0 gives the lower end more travel', () => {
    expect(curveScale(4).denormalize(0.5, 0, 100)).toBeLessThan(50)
    expect(curveScale(-4).denormalize(0.5, 0, 100)).toBeGreaterThan(50)
  })

  test('a curve near 0 is linear', () => {
    expect(curveScale(0).denormalize(0.25, 0, 100)).toBeCloseTo(25)
    expect(curveScale(0.0001).denormalize(0.25, 0, 100)).toBeCloseTo(25)
  })

  test('curveWithCenterValue puts the centre at half the travel', () => {
    const scale = curveScale(curveWithCenterValue(-12, -60, 6))
    expect(scale.denormalize(0.5, -60, 6)).toBeCloseTo(-12, 6)
  })

  test('curveWithCenterValue rejects a centre outside the range', () => {
    expect(() => curveWithCenterValue(-60, -60, 6)).toThrow(RangeError)
    expect(() => curveWithCenterValue(10, -60, 6)).toThrow(RangeError)
  })

  test('the slope at either end stays finite and non-zero', () => {
    // This is what skewScale gets wrong: a dead zone or a jump at min.
    const scale = curveScale(7)
    const atBottom = scale.denormalize(0.01, MIN, MAX) - MIN
    expect(atBottom).toBeGreaterThan(0.1)
    expect(atBottom).toBeLessThan(100)
  })
})

describe('symmetricSkewScale', () => {
  test('leaves the middle of the range in the middle of the travel', () => {
    for (const skew of [0.5, 1, 2]) {
      expect(symmetricSkewScale(skew).denormalize(0.5, -100, 100)).toBeCloseTo(
        0,
        6,
      )
    }
  })

  test('is symmetric about the middle', () => {
    const scale = symmetricSkewScale(0.5)
    for (const offset of [0.1, 0.25, 0.4]) {
      const below = scale.denormalize(0.5 - offset, -100, 100)
      const above = scale.denormalize(0.5 + offset, -100, 100)
      expect(below).toBeCloseTo(-above, 6)
    }
  })

  test('skew < 1 gives the middle more travel', () => {
    const fine = symmetricSkewScale(0.5)
    const coarse = symmetricSkewScale(2)
    const step = (scale: Scale) =>
      scale.denormalize(0.51, -100, 100) - scale.denormalize(0.5, -100, 100)
    expect(step(fine)).toBeLessThan(step(linearScale))
    expect(step(coarse)).toBeGreaterThan(step(linearScale))
  })

  test('skew of 1 is linear', () => {
    expect(symmetricSkewScale(1).denormalize(0.25, 0, 100)).toBeCloseTo(25)
    expect(symmetricSkewScale(1).normalize(25, 0, 100)).toBeCloseTo(0.25)
  })
})
