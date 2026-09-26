import { relativeMapping } from '@tremolo-ui/dom'

import { drag } from '../../src/actions/drag'
import { dragValue } from '../../src/actions/drag-value'
import { dropZone } from '../../src/actions/drop-zone'
import { longPress } from '../../src/actions/long-press'
import { wheel } from '../../src/actions/wheel'
import { pointerEvent, withPointerCapture } from '../helpers'

import type { ActionReturn } from 'svelte/action'

function element() {
  const node = document.createElement('div')
  document.body.appendChild(node)
  withPointerCapture(node)
  return node
}

/** The action's return value, which the types allow to be void. */
const handle = <P>(value: void | ActionReturn<P>) => value as ActionReturn<P>

afterEach(() => {
  document.body.replaceChildren()
})

test('drag reports the movement, and update swaps the handler in place', () => {
  const node = element()
  const first = vi.fn()
  const second = vi.fn()
  const action = handle(drag(node, { onDrag: first }))

  node.dispatchEvent(pointerEvent('pointerdown', { screenX: 0, screenY: 0 }))
  node.dispatchEvent(pointerEvent('pointermove', { screenX: 5, screenY: 0 }))
  expect(first).toHaveBeenCalled()

  action.update?.({ onDrag: second })
  node.dispatchEvent(pointerEvent('pointermove', { screenX: 10, screenY: 0 }))
  expect(second).toHaveBeenCalled()

  action.destroy?.()
})

test('an option taken out of the argument stops applying', () => {
  const node = element()
  const onDrag = vi.fn()
  const action = handle(drag(node, { onDrag }))
  action.update?.(undefined)
  node.dispatchEvent(pointerEvent('pointerdown', { screenX: 0 }))
  node.dispatchEvent(pointerEvent('pointermove', { screenX: 5 }))
  expect(onDrag).not.toHaveBeenCalled()
  action.destroy?.()
})

test('wheel falls back to its default when an option is left out', () => {
  const node = element()
  const onWheel = vi.fn()
  const action = handle(wheel(node, { onWheel, requireFocus: true }))
  node.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
  expect(onWheel).not.toHaveBeenCalled()
  action.update?.({ onWheel })
  node.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
  expect(onWheel).toHaveBeenCalledTimes(1)
  action.destroy?.()
})

test('dragValue drives a value', () => {
  const node = element()
  let value = 50
  const action = handle(
    dragValue(node, {
      axis: { min: 0, max: 100 },
      mapping: relativeMapping({ pixelRange: 100 }),
      getValue: () => [value, value],
      onChange: ([x]) => {
        value = x
      },
    }),
  )
  node.dispatchEvent(pointerEvent('pointerdown', { screenX: 0, screenY: 0 }))
  node.dispatchEvent(pointerEvent('pointermove', { screenX: 10, screenY: 0 }))
  expect(value).toBe(60)
  action.destroy?.()
})

test('wheel hands the event over', () => {
  const node = element()
  const onWheel = vi.fn()
  const action = handle(wheel(node, { onWheel }))
  node.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
  expect(onWheel).toHaveBeenCalledTimes(1)
  action.destroy?.()
  node.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
  expect(onWheel).toHaveBeenCalledTimes(1)
})

test('longPress repeats while the element is held', () => {
  vi.useFakeTimers()
  const node = element()
  const onPress = vi.fn()
  const action = handle(longPress(node, { onPress, delay: 100, interval: 20 }))
  node.dispatchEvent(pointerEvent('pointerdown'))
  vi.advanceTimersByTime(140)
  expect(onPress).toHaveBeenCalledTimes(4)
  window.dispatchEvent(pointerEvent('pointerup'))
  vi.advanceTimersByTime(100)
  expect(onPress).toHaveBeenCalledTimes(4)
  action.destroy?.()
  vi.useRealTimers()
})

test('dropZone takes the files dropped on it', () => {
  const node = element()
  const onDrop = vi.fn()
  const action = handle(dropZone(node, { onDrop }))
  const file = new File([''], 'a.wav', { type: 'audio/wav' })
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: { types: ['Files'], files: [file], items: [] },
  })
  node.dispatchEvent(event)
  expect(onDrop).toHaveBeenCalledWith([file], event)
  action.destroy?.()
})
