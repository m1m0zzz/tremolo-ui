import {
  mapModifier,
  selectModifier,
  type InputEventOption,
  type ModifierValue,
} from '../../src/input/modifiers'

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

describe('selectModifier()', () => {
  test('a bare amount is used whatever is held', () => {
    expect(selectModifier(['raw', 1], held('shiftKey'))).toStrictEqual({
      value: ['raw', 1],
      modifier: null,
    })
  })

  test('falls back to default when nothing is held', () => {
    const options: InputOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
    }
    expect(selectModifier(options, NONE)).toStrictEqual({
      value: ['raw', 1],
      modifier: null,
    })
  })

  test('picks the entry of the modifier being held', () => {
    const options: InputOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
      alt: ['normalized', 0.5],
    }
    expect(selectModifier(options, held('shiftKey'))).toStrictEqual({
      value: ['raw', 0.1],
      modifier: 'shift',
    })
    expect(selectModifier(options, held('altKey'))).toStrictEqual({
      value: ['normalized', 0.5],
      modifier: 'alt',
    })
  })

  test('a modifier with no entry falls through to default', () => {
    const options: InputOptions = {
      default: ['raw', 1],
      shift: ['raw', 0.1],
    }
    expect(selectModifier(options, held('altKey'))).toStrictEqual({
      value: ['raw', 1],
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
    expect(selectModifier(options, held('shiftKey', 'ctrlKey'))).toStrictEqual({
      value: ['raw', 10],
      modifier: 'ctrl',
    })
    expect(selectModifier(options, held('ctrlKey', 'metaKey'))).toStrictEqual({
      value: ['raw', 100],
      modifier: 'meta',
    })
  })

  test('with no event at all, default applies', () => {
    expect(
      selectModifier({ default: ['raw', 1], shift: ['raw', 0.1] }),
    ).toStrictEqual({ value: ['raw', 1], modifier: null })
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
