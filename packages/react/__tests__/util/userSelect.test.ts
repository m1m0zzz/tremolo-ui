import {
  addUserSelectNone,
  removeUserSelectNone,
} from '../../src/components/_util'

const body = () => window.document.body

afterEach(() => {
  // Unwind whatever a failing expectation left behind.
  for (let i = 0; i < 5; i++) removeUserSelectNone()
  body().style.cssText = ''
})

describe('the user-select applied to the page while dragging', () => {
  test('is set and then taken away again', () => {
    addUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('none')

    removeUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('')
  })

  // `-webkit-user-select` is set for Safari and cannot be asserted here:
  // jsdom's CSSStyleDeclaration drops properties it does not know, so
  // setProperty is a silent no-op for it.

  test('restores what the page had set itself', () => {
    body().style.setProperty('user-select', 'text')

    addUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('none')

    removeUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('text')
  })

  test('survives two drags at once', () => {
    // Two fingers on two components: the first release must not restore, or
    // the drag still in progress starts selecting text.
    addUserSelectNone()
    addUserSelectNone()

    removeUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('none')

    removeUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('')
  })

  test('an unmatched release does nothing', () => {
    removeUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('')

    addUserSelectNone()
    expect(body().style.getPropertyValue('user-select')).toBe('none')
  })
})
