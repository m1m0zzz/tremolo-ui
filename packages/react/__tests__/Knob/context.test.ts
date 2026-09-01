import {
  arcRadius,
  center,
  pointOnArc,
  viewBoxSize,
} from '../../src/components/Knob/context'

describe('arcRadius', () => {
  // The arc used to be drawn at the full radius, so half the stroke fell
  // outside the viewBox and was rescued with overflow: visible.
  test('insets by half the stroke width', () => {
    expect(arcRadius(6)).toBe(center - 3)
    expect(arcRadius(0)).toBe(center)
  })

  test('accepts a numeric string', () => {
    expect(arcRadius('10')).toBe(center - 5)
  })

  test('falls back to the full radius for values it cannot read', () => {
    expect(arcRadius(undefined)).toBe(center)
    expect(arcRadius('50%')).toBe(center - 25)
    expect(arcRadius('thin')).toBe(center)
  })
})

describe('pointOnArc', () => {
  test('-90 degrees is the left of the circle', () => {
    const { x, y } = pointOnArc(-90, center)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(center)
  })

  test('0 degrees is the top of the circle', () => {
    const { x, y } = pointOnArc(0, center)
    expect(x).toBeCloseTo(center)
    expect(y).toBeCloseTo(0)
  })

  test('the stroke stays inside the viewBox at every angle', () => {
    const strokeWidth = 6
    const radius = arcRadius(strokeWidth)

    for (let angle = -180; angle <= 180; angle += 5) {
      const { x, y } = pointOnArc(angle, radius)
      const half = strokeWidth / 2
      expect(x - half).toBeGreaterThanOrEqual(0)
      expect(y - half).toBeGreaterThanOrEqual(0)
      expect(x + half).toBeLessThanOrEqual(viewBoxSize)
      expect(y + half).toBeLessThanOrEqual(viewBoxSize)
    }
  })
})
