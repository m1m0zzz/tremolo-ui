import { exponentialScale, skewScale } from '@tremolo-ui/functions'

import {
  createDragValue,
  elementMapping,
  relativeMapping,
  type DragValueOptions,
} from '../../src/pointer/dragValue'

import { pointerEvent, withPointerCapture } from './helpers'

import type { XY } from '../../src/xy'

/** Instances created by setup(), destroyed after each test. */
const instances: { destroy: () => void }[] = []

/** jsdom lays nothing out, so the rect of the base element is faked. */
function withRect(
  element: Element,
  rect: { left: number; top: number; right: number; bottom: number },
) {
  element.getBoundingClientRect = () =>
    ({
      ...rect,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    }) as DOMRect
}

function setup(options: Partial<DragValueOptions> = {}) {
  const element = document.createElement('div')
  document.body.appendChild(element)
  withPointerCapture(element)

  const base = document.createElement('div')
  document.body.appendChild(base)
  withRect(base, { left: 0, top: 0, right: 100, bottom: 100 })

  const onChange = jest.fn()
  const onDragStart = jest.fn()
  const onDragEnd = jest.fn()

  const instance = createDragValue(element, {
    axis: { min: 0, max: 100 },
    mapping: elementMapping(() => base),
    onChange,
    onDragStart,
    onDragEnd,
    ...options,
  })

  instances.push(instance)

  return { element, base, instance, onChange, onDragStart, onDragEnd }
}

/** The value of the last call to a handler. */
function lastValue(handler: jest.Mock): XY<number> {
  return handler.mock.calls[handler.mock.calls.length - 1][0]
}

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy()
  document.body.innerHTML = ''
})

describe('elementMapping', () => {
  test('normalizes the pointer against the rect of the base element', () => {
    const { element, onChange } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 25, clientY: 60, screenX: 25 }),
    )

    expect(lastValue(onChange)).toEqual([25, 60])
  })

  test('clamps to the range outside the element', () => {
    const { element, onChange } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: -40, clientY: 400, screenX: 40 }),
    )

    expect(lastValue(onChange)).toEqual([0, 100])
  })

  test('reports 0 rather than throwing on a collapsed element', () => {
    const { element, base, onChange } = setup()
    withRect(base, { left: 50, top: 50, right: 50, bottom: 50 })

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 25, clientY: 25, screenX: 25 }),
    )

    expect(lastValue(onChange)).toEqual([0, 0])
  })

  test('ignores the drag while the base element is missing', () => {
    const { element, onChange } = setup({
      mapping: elementMapping(() => null),
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 25, clientY: 25, screenX: 25 }),
    )

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('relativeMapping', () => {
  test('moves the value away from where the drag started', () => {
    const { element, onChange } = setup({
      mapping: relativeMapping(),
      getValue: () => [40, 40],
      // Dragging up raises the value, as a knob is expected to behave.
      axis: [
        { min: 0, max: 100 },
        { min: 0, max: 100, reverse: true },
      ],
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 10, screenY: -30 }),
    )

    expect(lastValue(onChange)).toEqual([50, 70])
  })

  test('keeps the origin of the drag, so the value comes back where it left', () => {
    const value: XY<number> = [90, 0]
    const { element, instance, onChange } = setup({
      mapping: relativeMapping(),
      getValue: () => value,
      axis: { min: 0, max: 100 },
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(pointerEvent('pointermove', { screenX: 50 }))
    expect(lastValue(onChange)[0]).toBe(100)

    // The wrapper now holds the clamped value, but the drag is still measured
    // from where it started, so the value only moves once the pointer is back
    // past that point.
    value[0] = 100
    instance.update({ getValue: () => value })
    element.dispatchEvent(pointerEvent('pointermove', { screenX: 20 }))
    expect(lastValue(onChange)[0]).toBe(100)

    element.dispatchEvent(pointerEvent('pointermove', { screenX: -20 }))
    expect(lastValue(onChange)[0]).toBeCloseTo(70)
  })

  test('scales the travel with pixelRange', () => {
    const { element, onChange } = setup({
      mapping: relativeMapping({ pixelRange: [200, 50] }),
      getValue: () => [0, 0],
      axis: { min: 0, max: 100 },
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { screenX: 100, screenY: 25 }),
    )

    expect(lastValue(onChange)).toEqual([50, 50])
  })
})

describe('axis scaling', () => {
  test('rounds to the step and keeps the value in range', () => {
    const { element, onChange } = setup({
      axis: { min: 0, max: 10, step: 4 },
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 100, clientY: 55, screenX: 100 }),
    )

    // The far end rounds up to 12 on a step of 4, and is clamped back into range.
    expect(lastValue(onChange)).toEqual([10, 4])
  })

  test('applies the scale', () => {
    const { element, onChange } = setup({
      axis: { min: 0, max: 100, scale: skewScale(0.5), step: undefined },
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 50, clientY: 50, screenX: 50 }),
    )

    expect(lastValue(onChange)).toEqual([25, 25])
  })

  test('a scale other than linear also drives the relative mapping', () => {
    // relativeMapping reads the current value back through the scale to find
    // its origin, so the two directions have to agree.
    let value = 1000
    const { element, onChange } = setup({
      axis: { min: 20, max: 20000, scale: exponentialScale, step: undefined },
      mapping: relativeMapping({ pixelRange: 100 }),
      getValue: (): XY<number> => [value, value],
    })

    element.dispatchEvent(pointerEvent('pointerdown', { screenX: 0 }))
    // No movement: the value has to come back unchanged.
    element.dispatchEvent(pointerEvent('pointermove', { screenX: 0 }))
    expect(lastValue(onChange)[0]).toBeCloseTo(1000, 6)

    // A tenth of the travel is a tenth of the way from 20 to 20000 in ratio,
    // which is the same factor wherever the drag starts.
    element.dispatchEvent(pointerEvent('pointermove', { screenX: 10 }))
    const factor = Math.pow(20000 / 20, 0.1)
    expect(lastValue(onChange)[0]).toBeCloseTo(1000 * factor, 6)

    value = 100
    element.dispatchEvent(pointerEvent('pointerup', { screenX: 10 }))
    element.dispatchEvent(pointerEvent('pointerdown', { screenX: 0 }))
    element.dispatchEvent(pointerEvent('pointermove', { screenX: 10 }))
    expect(lastValue(onChange)[0]).toBeCloseTo(100 * factor, 6)
  })

  test('reverse flips the axis', () => {
    const { element, onChange } = setup({
      axis: { min: 0, max: 100, reverse: true },
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 20, clientY: 20, screenX: 20 }),
    )

    expect(lastValue(onChange)).toEqual([80, 80])
  })
})

describe('createDragValue', () => {
  test('does not report on pointer down by default', () => {
    const { element, onChange, onDragStart } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 30, clientY: 30 }),
    )

    expect(onChange).not.toHaveBeenCalled()
    expect(lastValue(onDragStart)).toEqual([30, 30])
  })

  test('reports on pointer down with updateOnPointerDown', () => {
    const { element, onChange, onDragStart } = setup({
      updateOnPointerDown: true,
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 30, clientY: 30 }),
    )

    expect(lastValue(onChange)).toEqual([30, 30])
    expect(lastValue(onDragStart)).toEqual([30, 30])
  })

  test('ends with the last reported value', () => {
    const { element, onDragEnd } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 40, clientY: 40, screenX: 40 }),
    )
    element.dispatchEvent(pointerEvent('pointerup', { screenX: 40 }))

    expect(lastValue(onDragEnd)).toEqual([40, 40])
  })

  test('update() swaps the axis without interrupting the drag', () => {
    const { element, instance, onChange } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 50, clientY: 50, screenX: 50 }),
    )
    expect(lastValue(onChange)).toEqual([50, 50])

    instance.update({ axis: { min: 0, max: 10 } })
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: 50, clientY: 50, screenX: 60 }),
    )

    expect(lastValue(onChange)).toEqual([5, 5])
  })
})
