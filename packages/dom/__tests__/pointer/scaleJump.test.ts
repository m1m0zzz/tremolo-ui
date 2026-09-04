import {
  curveScale,
  curveWithCenterValue,
  exponentialScale,
  skewScale,
  skewWithCenterValue,
  type Scale,
} from '@tremolo-ui/functions'

import { createDragValue, relativeMapping } from '../../src/pointer/dragValue'

import { pointerEvent, withPointerCapture } from './helpers'

import type { XY } from '../../src/xy'

/**
 * Drive the wiring a Knob uses: relativeMapping over 100px, the y axis
 * reversed so that dragging up raises the value.
 */
function dragUp(
  startValue: number,
  axis: { min: number; max: number; step?: number; scale: Scale },
  pixels: number[],
) {
  const element = document.createElement('div')
  document.body.appendChild(element)
  withPointerCapture(element)

  let value = startValue
  const seen: number[] = []

  const instance = createDragValue(element, {
    axis: [{ ...axis }, { ...axis, reverse: true }],
    mapping: relativeMapping(),
    getValue: (): XY<number> => [value, value],
    onChange: (v) => {
      value = v[1]
      seen.push(v[1])
    },
  })

  element.dispatchEvent(pointerEvent('pointerdown', { screenX: 0, screenY: 0 }))
  for (const py of pixels) {
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 0, screenY: py }),
    )
  }
  element.dispatchEvent(pointerEvent('pointerup', { screenX: 0, screenY: 0 }))
  instance.destroy()
  element.remove()

  return seen
}

/** What one pixel of drag is worth, starting from `startValue`. */
const firstPixel = (
  startValue: number,
  axis: { min: number; max: number; step?: number; scale: Scale },
) => dragUp(startValue, axis, [-1])[0] - startValue

describe('a skewed knob jumps at the bottom of its range', () => {
  // The behaviour 5.8 reported, kept as the baseline the other scales are
  // measured against. skewScale is still offered for JUCE compatibility, so
  // this is documented rather than fixed.
  const dB = { min: -60, max: 6, step: 0.1 }

  test('skewScale moves 12% of the range on the first pixel', () => {
    const scale = skewScale(skewWithCenterValue(-12, dB.min, dB.max))
    expect(firstPixel(dB.min, { ...dB, scale })).toBeCloseTo(8, 1)
  })

  test('curveScale moves a fraction of that', () => {
    const scale = curveScale(curveWithCenterValue(-12, dB.min, dB.max))
    expect(firstPixel(dB.min, { ...dB, scale })).toBeLessThan(2)
  })

  test('curveScale keeps the whole range within a factor of 10 per pixel', () => {
    const scale = curveScale(curveWithCenterValue(-12, dB.min, dB.max))
    const axis = { ...dB, scale }
    const steps = [dB.min, -40, -20, -12, 0].map((v) => firstPixel(v, axis))
    expect(Math.max(...steps) / Math.min(...steps)).toBeLessThan(10)
  })
})

describe('a skewed knob has a dead zone at the bottom', () => {
  // The other half of 5.8: with skew < 1 the slope at min is zero, so the
  // first several pixels of a drag change nothing at all.
  const freq = { min: 20, max: 22000, step: 1 }

  test('skewScale reports the same value for the first 12 pixels', () => {
    const scale = skewScale(skewWithCenterValue(663, freq.min, freq.max))
    const seen = dragUp(
      freq.min,
      { ...freq, scale },
      Array.from({ length: 12 }, (_, i) => -(i + 1)),
    )
    expect(new Set(seen)).toEqual(new Set([freq.min]))
  })

  test('exponentialScale moves on the first pixel', () => {
    const seen = dragUp(freq.min, { ...freq, scale: exponentialScale }, [-1])
    expect(seen[0]).toBeGreaterThan(freq.min)
  })

  test('exponentialScale gives every octave the same travel', () => {
    const axis = { ...freq, step: undefined, scale: exponentialScale }
    // 10 px is a tenth of the travel wherever the drag starts, so the ratio
    // it produces has to be the same each time.
    const ratio = (from: number) => dragUp(from, axis, [-10])[0] / from
    const first = ratio(freq.min)
    for (const from of [100, 1000, 10000]) {
      expect(ratio(from)).toBeCloseTo(first, 6)
    }
  })
})
