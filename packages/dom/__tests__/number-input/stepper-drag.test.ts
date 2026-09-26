import { createStepperDrag } from '../../src/number-input/stepper-drag'
import { pointerEvent, withPointerCapture } from '../pointer/helpers'

function setup(value = 50) {
  const element = document.createElement('div')
  document.body.appendChild(element)
  withPointerCapture(element)
  const state = { value }
  const onChange = vi.fn((next: number) => {
    state.value = next
  })
  const instance = createStepperDrag(element, {
    getValue: () => state.value,
    range: { min: 0, max: 100, step: 1 },
    onChange,
  })
  const at = (type: string, y: number, init = {}) =>
    element.dispatchEvent(
      pointerEvent(type, { screenY: y, clientY: y, ...init }),
    )
  return { element, instance, onChange, at, state }
}

afterEach(() => {
  document.body.replaceChildren()
})

test('dragging up raises the value one step per pixel', () => {
  const { at, onChange, instance } = setup()
  at('pointerdown', 100)
  at('pointermove', 99)
  // The first move only sets where counting starts from.
  expect(onChange).not.toHaveBeenCalled()
  at('pointermove', 94)
  expect(onChange).toHaveBeenLastCalledWith(55)
  expect(instance.moved()).toBe(true)
  at('pointermove', 104)
  expect(onChange).toHaveBeenLastCalledWith(45)
  at('pointerup', 104)
  expect(instance.moved()).toBe(false)
  instance.destroy()
})

test('pixels sets how far one step is', () => {
  const { at, onChange, instance } = setup()
  instance.update({ pixels: 10 })
  at('pointerdown', 100)
  at('pointermove', 99)
  at('pointermove', 79)
  expect(onChange).toHaveBeenLastCalledWith(52)
  instance.destroy()
})

test('the value is clamped to the range', () => {
  const { at, onChange, instance } = setup(99)
  at('pointerdown', 100)
  at('pointermove', 99)
  at('pointermove', 80)
  expect(onChange).toHaveBeenLastCalledWith(100)
  instance.destroy()
})

test('shift moves a tenth as much, without jumping when pressed', () => {
  const { at, onChange, instance } = setup()
  at('pointerdown', 100)
  at('pointermove', 99)
  at('pointermove', 89)
  expect(onChange).toHaveBeenLastCalledWith(60)
  // Pressing shift keeps the value where it is...
  at('pointermove', 89, { shiftKey: true })
  expect(onChange).toHaveBeenCalledTimes(1)
  // ...and counts a tenth per pixel from there.
  at('pointermove', 79, { shiftKey: true })
  expect(onChange).toHaveBeenLastCalledWith(61)
  instance.destroy()
})
