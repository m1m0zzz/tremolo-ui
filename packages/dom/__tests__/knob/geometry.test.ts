import {
  KNOB_VIEWBOX_SIZE,
  knobArcPoint,
  knobArcRadius,
} from '../../src/knob/geometry'

const center = KNOB_VIEWBOX_SIZE / 2

describe('knobArcRadius', () => {
  // The arc used to be drawn at the full radius, so half the stroke fell
  // outside the viewBox and was rescued with overflow: visible.
  test('insets by half the stroke width', () => {
    expect(knobArcRadius(6)).toBe(center - 3)
    expect(knobArcRadius(0)).toBe(center)
  })

  test('accepts a numeric string', () => {
    expect(knobArcRadius('10')).toBe(center - 5)
  })

  test('falls back to the full radius for values it cannot read', () => {
    expect(knobArcRadius(undefined)).toBe(center)
    expect(knobArcRadius('50%')).toBe(center - 25)
    expect(knobArcRadius('thin')).toBe(center)
  })
})

describe('knobArcPoint', () => {
  test('-90 degrees is the left of the circle', () => {
    const { x, y } = knobArcPoint(-90, center)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(center)
  })

  test('0 degrees is the top of the circle', () => {
    const { x, y } = knobArcPoint(0, center)
    expect(x).toBeCloseTo(center)
    expect(y).toBeCloseTo(0)
  })

  test('the stroke stays inside the viewBox at every angle', () => {
    const strokeWidth = 6
    const radius = knobArcRadius(strokeWidth)

    for (let angle = -180; angle <= 180; angle += 5) {
      const { x, y } = knobArcPoint(angle, radius)
      const half = strokeWidth / 2
      expect(x - half).toBeGreaterThanOrEqual(0)
      expect(y - half).toBeGreaterThanOrEqual(0)
      expect(x + half).toBeLessThanOrEqual(KNOB_VIEWBOX_SIZE)
      expect(y + half).toBeLessThanOrEqual(KNOB_VIEWBOX_SIZE)
    }
  })
})
