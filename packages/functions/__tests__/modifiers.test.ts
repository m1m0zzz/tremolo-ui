import { applyDelta } from '../src/scales'
import {
  mapModifier,
  selectInputEvent,
  selectModifier,
  type InputEventOption,
  type ModifierValue,
} from '../src/types'

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

describe('selectInputEvent()', () => {
  test('a bare amount is used whatever is held', () => {
    expect(selectInputEvent(['raw', 1], held('shiftKey'))).toStrictEqual({
      option: ['raw', 1],
      modifier: null,
    })
  })

  test('falls back to default when nothing is held', () => {
    const options: InputOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
    }
    expect(selectInputEvent(options, NONE)).toStrictEqual({
      option: ['raw', 1],
      modifier: null,
    })
  })

  test('picks the entry of the modifier being held', () => {
    const options: InputOptions = {
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
    const options: InputOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
    }
    expect(selectInputEvent(options, held('altKey'))).toStrictEqual({
      option: ['raw', 1],
      modifier: null,
    })
  })

  test('two at once resolve in a fixed order, meta first', () => {
    const options: InputOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
      ctrl: ['raw', 10],
      meta: ['raw', 100],
    }
    expect(
      selectInputEvent(options, held('shiftKey', 'ctrlKey')),
    ).toStrictEqual({ option: ['raw', 10], modifier: 'ctrl' })
    expect(selectInputEvent(options, held('ctrlKey', 'metaKey'))).toStrictEqual(
      { option: ['raw', 100], modifier: 'meta' },
    )
  })

  test('with no event at all, default applies', () => {
    expect(
      selectInputEvent({ default: ['raw', 1], shift: ['raw', 0.1] }),
    ).toStrictEqual({ option: ['raw', 1], modifier: null })
  })

  test('keeps zero-valued modifier entries', () => {
    expect(
      selectModifier({ default: 1, shift: 0 }, held('shiftKey')),
    ).toStrictEqual({ value: 0, modifier: 'shift' })
    expect(mapModifier({ default: 1, shift: 0 }, (value) => value * 2)).toEqual(
      {
        default: 2,
        shift: 0,
      },
    )
  })

  test('maps bare values and every configured modifier', () => {
    expect(mapModifier(2, (value) => ['raw', value] as const)).toEqual([
      'raw',
      2,
    ])
    expect(
      mapModifier({ default: 1, alt: 2, meta: 3 }, (value) => value + 10),
    ).toEqual({ default: 11, alt: 12, meta: 13 })
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
