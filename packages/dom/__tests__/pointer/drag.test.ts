import { createDrag, type DragState } from '../../src/pointer/drag'

import { pointerEvent, withPointerCapture } from './helpers'

/** Instances created by setup(), destroyed after each test. */
const instances: { destroy: () => void }[] = []

function setup(options: Parameters<typeof createDrag>[1] = {}) {
  const element = document.createElement('div')
  document.body.appendChild(element)
  withPointerCapture(element)

  const onDragStart = jest.fn()
  const onDrag = jest.fn()
  const onDragEnd = jest.fn()

  const instance = createDrag(element, {
    onDragStart,
    onDrag,
    onDragEnd,
    ...options,
  })

  instances.push(instance)

  return { element, instance, onDragStart, onDrag, onDragEnd }
}

afterEach(() => {
  // A drag left in progress keeps a document level listener alive,
  // which would leak into the next test.
  for (const instance of instances.splice(0)) instance.destroy()
  document.body.innerHTML = ''
})

describe('createDrag', () => {
  test('reports total movement and per-event delta', () => {
    const { element, onDrag } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 10, screenY: 20 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 15, screenY: 20 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 30, screenY: 25 }),
    )

    expect(onDrag).toHaveBeenCalledTimes(2)
    expect(onDrag.mock.calls[0][0]).toMatchObject({
      x: 5,
      y: 0,
      deltaX: 5,
      deltaY: 0,
    })
    expect(onDrag.mock.calls[1][0]).toMatchObject({
      x: 20,
      y: 5,
      deltaX: 15,
      deltaY: 5,
    })
  })

  test('onDrag does not fire on pointerdown', () => {
    const { element, onDrag, onDragStart } = setup()
    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 10, screenY: 20 }),
    )
    expect(onDragStart).toHaveBeenCalledTimes(1)
    expect(onDrag).not.toHaveBeenCalled()
  })

  // Regression: the previous implementation used a truthy check on the stored
  // offset, so a drag starting at screen coordinate 0 produced a delta of 0 for
  // that axis forever, and onDrag never fired at all when both axes were 0.
  test('works when the drag starts at screen coordinate 0', () => {
    const { element, onDrag } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 8, screenY: 3 }),
    )

    expect(onDrag).toHaveBeenCalledTimes(1)
    expect(onDrag.mock.calls[0][0]).toMatchObject({
      x: 8,
      y: 3,
      deltaX: 8,
      deltaY: 3,
    })
  })

  test('movement below the threshold is dropped, not accumulated', () => {
    const { element, onDrag } = setup({ threshold: 5 })

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 2, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 4, screenY: 0 }),
    )
    expect(onDrag).not.toHaveBeenCalled()

    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 20, screenY: 0 }),
    )
    expect(onDrag).toHaveBeenCalledTimes(1)
    expect(onDrag.mock.calls[0][0]).toMatchObject({ x: 20, deltaX: 16 })
  })

  test('a threshold below 1 is clamped to 1', () => {
    const { element, onDrag } = setup({ threshold: 0 })

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 0, screenY: 0 }),
    )

    expect(onDrag).not.toHaveBeenCalled()
  })

  test('onDragEnd fires on pointerup and stops further tracking', () => {
    const { element, onDrag, onDragEnd } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointerup', { screenX: 10, screenY: 0 }),
    )
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onDragEnd.mock.calls[0][0]).toMatchObject({ x: 10, deltaX: 10 })

    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 50, screenY: 0 }),
    )
    expect(onDrag).not.toHaveBeenCalled()
  })

  test('pointercancel ends the drag', () => {
    const { element, onDragEnd } = setup()
    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointercancel', { screenX: 0, screenY: 0 }),
    )
    expect(onDragEnd).toHaveBeenCalledTimes(1)
  })

  test('onDragEnd does not fire without a preceding pointerdown', () => {
    const { element, onDragEnd } = setup()
    element.dispatchEvent(
      pointerEvent('pointerup', { screenX: 10, screenY: 0 }),
    )
    expect(onDragEnd).not.toHaveBeenCalled()
  })

  test('a second pointer is ignored while a drag is in progress', () => {
    const { element, onDragStart, onDrag } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { pointerId: 1, screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointerdown', { pointerId: 2, screenX: 100, screenY: 0 }),
    )
    expect(onDragStart).toHaveBeenCalledTimes(1)

    element.dispatchEvent(
      pointerEvent('pointermove', { pointerId: 2, screenX: 200, screenY: 0 }),
    )
    expect(onDrag).not.toHaveBeenCalled()

    element.dispatchEvent(
      pointerEvent('pointermove', { pointerId: 1, screenX: 10, screenY: 0 }),
    )
    expect(onDrag).toHaveBeenCalledTimes(1)
  })

  test('exposes client coordinates', () => {
    const { element, onDrag } = setup()
    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, clientX: 3, clientY: 4 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 10, clientX: 13, clientY: 14 }),
    )
    const s: DragState = onDrag.mock.calls[0][0]
    expect(s.clientX).toBe(13)
    expect(s.clientY).toBe(14)
  })

  test('destroy removes the listener', () => {
    const { element, instance, onDragStart } = setup()
    instance.destroy()
    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    expect(onDragStart).not.toHaveBeenCalled()
  })

  // A long press would otherwise start a text selection, because touch-action
  // tells the browser the element will not be panned.
  // Of the properties applied, jsdom only implements user-select.
  test('suppresses selection while the instance is alive', () => {
    const { element, instance } = setup()
    expect(element.style.getPropertyValue('user-select')).toBe('none')

    instance.destroy()
    expect(element.style.getPropertyValue('user-select')).toBe('')
  })

  test('cancels selectstart while a drag is in progress', () => {
    const { element } = setup()

    const before = new Event('selectstart', { bubbles: true, cancelable: true })
    document.dispatchEvent(before)
    expect(before.defaultPrevented).toBe(false)

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    const during = new Event('selectstart', { bubbles: true, cancelable: true })
    document.dispatchEvent(during)
    expect(during.defaultPrevented).toBe(true)

    element.dispatchEvent(pointerEvent('pointerup', { screenX: 0, screenY: 0 }))
    const after = new Event('selectstart', { bubbles: true, cancelable: true })
    document.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(false)
  })

  test('applies the cursor to the element only while dragging', () => {
    const { element } = setup({ cursor: 'grabbing' })
    expect(element.style.cursor).toBe('')

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    expect(element.style.cursor).toBe('grabbing')
    // The document is never touched; pointer capture keeps the cursor in
    // effect once the pointer leaves the element.
    expect(document.body.style.cursor).toBe('')

    element.dispatchEvent(pointerEvent('pointerup', { screenX: 0, screenY: 0 }))
    expect(element.style.cursor).toBe('')
  })

  test('restores a cursor the element already had', () => {
    const element = document.createElement('div')
    element.style.cursor = 'pointer'
    document.body.appendChild(element)
    withPointerCapture(element)
    const instance = createDrag(element, { cursor: 'grabbing' })
    instances.push(instance)

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    expect(element.style.cursor).toBe('grabbing')

    element.dispatchEvent(pointerEvent('pointerup', { screenX: 0, screenY: 0 }))
    expect(element.style.cursor).toBe('pointer')
  })

  test('restores a style the element already had', () => {
    const element = document.createElement('div')
    element.style.setProperty('user-select', 'text')
    document.body.appendChild(element)

    const instance = createDrag(element, {})
    expect(element.style.getPropertyValue('user-select')).toBe('none')

    instance.destroy()
    expect(element.style.getPropertyValue('user-select')).toBe('text')
  })

  test('destroy during a drag stops tracking', () => {
    const { element, instance, onDrag } = setup()
    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    instance.destroy()
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 50, screenY: 0 }),
    )
    expect(onDrag).not.toHaveBeenCalled()
  })

  test('falls back to the window when pointer capture is unavailable', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const onDrag = jest.fn()
    createDrag(element, { onDrag })

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    window.dispatchEvent(
      pointerEvent('pointermove', { screenX: 10, screenY: 0 }),
    )

    expect(onDrag).toHaveBeenCalledTimes(1)
  })
})
