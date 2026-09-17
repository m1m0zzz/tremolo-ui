import { skewScale } from '@tremolo-ui/functions'

import { applyDelta } from '../../src/input/apply-delta'

import type { InputEventOption, ModifierValue } from '../../src/input/modifiers'

type InputOptions = ModifierValue<InputEventOption>

const NONE = {
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
}
const held = (...keys: (keyof typeof NONE)[]) => ({
  ...NONE,
  ...Object.fromEntries(keys.map((k) => [k, true])),
})

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

  test.each([
    ['empty', { min: 10, max: 10 }],
    ['reversed', { min: 11, max: 10 }],
  ])('rejects an %s range in every mode', (_name, invalidRange) => {
    expect(() => applyDelta(10, 1, ['raw', 1], invalidRange)).toThrow(
      RangeError,
    )
    expect(() => applyDelta(10, 1, ['normalized', 0.1], invalidRange)).toThrow(
      RangeError,
    )
  })

  test.each([0, -1, NaN, Infinity])('rejects step %s', (step) => {
    expect(() =>
      applyDelta(10, 1, ['raw', 1], { min: 0, max: 100, step }),
    ).toThrow(RangeError)
  })

  test('applies the scale in normalized mode', () => {
    const skewed = { min: 0, max: 100, scale: skewScale(2) }
    // normalizeValue(25, 0, 100, 2) === 0.0625, +0.1875 => 0.25 => rawValue 50
    expect(applyDelta(25, 1, ['normalized', 0.1875], skewed)).toBeCloseTo(50)
    // raw mode ignores the scale
    expect(applyDelta(25, 1, ['raw', 10], skewed)).toBe(35)
  })
})

describe('applyDelta() with modifiers', () => {
  const range = { min: 0, max: 10, step: 1 }
  const options: InputOptions = {
    default: ['raw', 1],
    shift: ['raw', 0.1],
  }

  test('the default entry still snaps to step', () => {
    expect(applyDelta(3.4, 1, options, range, NONE)).toBe(4)
  })

  test('a modifier entry moves off the grid', () => {
    // Without the carve-out this rounds straight back to 3.
    expect(applyDelta(3, 1, options, range, held('shiftKey'))).toBeCloseTo(3.1)
  })

  test('an unmodified press brings an off-grid value back', () => {
    expect(applyDelta(3.1, 1, options, range, NONE)).toBe(4)
  })

  test('clamping still applies to a modifier entry', () => {
    expect(applyDelta(10, 1, options, range, held('shiftKey'))).toBe(10)
    expect(applyDelta(0, -1, options, range, held('shiftKey'))).toBe(0)
  })

  test('a bare tuple behaves exactly as before', () => {
    expect(applyDelta(3, 1, ['raw', 1], range)).toBe(4)
    expect(applyDelta(3, 1, ['raw', 0.1], range)).toBe(3)
    expect(applyDelta(3, 1, ['raw', 0.1], range, held('shiftKey'))).toBe(3)
  })

  test('normalized mode goes off the grid too', () => {
    const options: InputOptions = {
      default: ['normalized', 0.1],
      shift: ['normalized', 0.01],
    }
    expect(applyDelta(5, 1, options, range, held('shiftKey'))).toBeCloseTo(5.1)
  })

  test('a modifier entry does not accumulate error', () => {
    // The modifier carve-out takes `step` out of the pipeline, so nothing
    // rounded the artefact back and it built up press by press: this run used
    // to reach 5.699999999999998.
    let value = 5
    const pressed = [value]
    for (let i = 0; i < 12; i++) {
      value = applyDelta(value, 1, options, range, held('shiftKey'))
      pressed.push(value)
    }
    expect(pressed).toStrictEqual([
      5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6, 6.1, 6.2,
    ])
  })

  test('normalized mode does not accumulate either', () => {
    // Goes to a position and back, so the error arrives by a different route.
    const options: InputOptions = {
      default: ['normalized', 0.1],
      shift: ['normalized', 0.01],
    }
    let value = 5
    for (let i = 0; i < 12; i++) {
      value = applyDelta(value, 1, options, range, held('shiftKey'))
    }
    expect(value).toBe(6.2)
  })
})
