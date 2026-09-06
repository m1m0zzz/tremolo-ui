import { applyDelta } from '../src/scales'
import { selectInputEvent, type InputEventOptions } from '../src/types'

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

describe('selectInputEvent()', () => {
  test('a bare amount is used whatever is held', () => {
    expect(selectInputEvent(['raw', 1], held('shiftKey'))).toStrictEqual({
      option: ['raw', 1],
      modifier: null,
    })
  })

  test('falls back to default when nothing is held', () => {
    const options: InputEventOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
    }
    expect(selectInputEvent(options, NONE)).toStrictEqual({
      option: ['raw', 1],
      modifier: null,
    })
  })

  test('picks the entry of the modifier being held', () => {
    const options: InputEventOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
      alt: ['normalized', 0.5],
    }
    expect(selectInputEvent(options, held('shiftKey'))).toStrictEqual({
      option: ['raw', 0.1],
      modifier: 'shift',
    })
    expect(selectInputEvent(options, held('altKey'))).toStrictEqual({
      option: ['normalized', 0.5],
      modifier: 'alt',
    })
  })

  test('a modifier with no entry falls through to default', () => {
    const options: InputEventOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
    }
    expect(selectInputEvent(options, held('altKey')).modifier).toBeNull()
  })

  test('two at once resolve in a fixed order, meta first', () => {
    const options: InputEventOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
      ctrl: ['raw', 10],
      meta: ['raw', 100],
    }
    expect(
      selectInputEvent(options, held('shiftKey', 'ctrlKey')).modifier,
    ).toBe('ctrl')
    expect(selectInputEvent(options, held('ctrlKey', 'metaKey')).modifier).toBe(
      'meta',
    )
  })

  test('with no event at all, default applies', () => {
    expect(
      selectInputEvent({ default: ['raw', 1], shift: ['raw', 0.1] }),
    ).toStrictEqual({ option: ['raw', 1], modifier: null })
  })
})

describe('applyDelta() with modifiers', () => {
  const range = { min: 0, max: 10, step: 1 }
  const options: InputEventOptions = {
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
    const options: InputEventOptions = {
      default: ['normalized', 0.1],
      shift: ['normalized', 0.01],
    }
    expect(applyDelta(5, 1, options, range, held('shiftKey'))).toBeCloseTo(5.1)
  })
})
