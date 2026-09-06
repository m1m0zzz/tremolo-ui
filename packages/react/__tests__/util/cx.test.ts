import { cx } from '../../src/components/_util/cx'

describe('cx', () => {
  test('joins the names it is given', () => {
    expect(cx('tremolo-knob', 'mine')).toBe('tremolo-knob mine')
  })

  test('drops absent names rather than writing them out', () => {
    // The call shape used throughout the package: a constant name plus a
    // `className` prop that is usually not there.
    expect(cx('tremolo-knob', undefined)).toBe('tremolo-knob')
    expect(cx('tremolo-knob', null)).toBe('tremolo-knob')
    expect(cx('tremolo-knob', false)).toBe('tremolo-knob')
  })

  test('drops an empty string, so no double space is left behind', () => {
    expect(cx('tremolo-knob', '')).toBe('tremolo-knob')
    expect(cx('', 'mine')).toBe('mine')
  })

  test('gives an empty string when nothing is left', () => {
    expect(cx()).toBe('')
    expect(cx(undefined, false)).toBe('')
  })
})
