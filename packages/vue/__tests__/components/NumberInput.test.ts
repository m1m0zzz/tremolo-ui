import { fireEvent, screen } from '@testing-library/vue'
import { h, nextTick } from 'vue'

import {
  NumberInput,
  NumberInputDecrementStepper,
  NumberInputField,
  NumberInputIncrementStepper,
  NumberInputStepper,
} from '../../src'
import { pointerEvent, withPointerCapture } from '../helpers'

import { renderWithModel } from './render'

async function setup(props: Record<string, unknown> = {}) {
  const { onChange } = await renderWithModel(
    NumberInput,
    (props.modelValue as number) ?? 50,
    props,
    () => [
      h(NumberInputField),
      h(NumberInputStepper, { 'data-testid': 'stepper' }, () => [
        h(NumberInputIncrementStepper),
        h(NumberInputDecrementStepper),
      ]),
    ],
  )
  const input = screen.getByRole('spinbutton') as HTMLInputElement
  const up = screen.getByRole('button', { name: 'Increment' })
  const stepper = screen.getByTestId('stepper')
  withPointerCapture(stepper)
  return { input, up, stepper, onChange }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('NumberInput', () => {
  test('shows the formatted value, with the value in ARIA', async () => {
    const { input } = await setup({ format: (v: number) => `${v} Hz` })
    expect(input).toHaveValue('50 Hz')
    expect(input).toHaveAttribute('aria-valuenow', '50')
    expect(input).toHaveAttribute('aria-valuetext', '50 Hz')
  })

  test('typing reports the number unclamped, and blur commits it clamped', async () => {
    const { input, onChange } = await setup({ min: 0, max: 100 })
    await fireEvent.update(input, '1500')
    expect(onChange).toHaveBeenLastCalledWith(1500)
    await fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(100)
    expect(input).toHaveValue('100')
  })

  test('text with no number goes back to what was shown', async () => {
    const { input } = await setup()
    await fireEvent.update(input, 'abc')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(input).toHaveValue('50')
  })

  test('arrow keys step the value', async () => {
    const { input, onChange } = await setup()
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(51)
  })

  test('keepCaretOnStep keeps the caret at the same digit', async () => {
    const { input } = await setup({
      modelValue: 9.9,
      step: 0.1,
      keepCaretOnStep: true,
    })
    input.focus()
    input.setSelectionRange(1, 1)
    await fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })
    await nextTick()
    await nextTick()
    expect(input).toHaveValue('10')
    expect(input.selectionStart).toBe(2)
  })

  test('the stepper buttons repeat while held and stop at the ends', async () => {
    vi.useFakeTimers()
    const { up, onChange } = await setup({ max: 52 })
    up.dispatchEvent(pointerEvent('pointerdown'))
    expect(onChange).toHaveBeenLastCalledWith(51)
    // Async, so that the new value reaches the props between repeats.
    await vi.advanceTimersByTimeAsync(500)
    expect(onChange).toHaveBeenLastCalledWith(52)
    window.dispatchEvent(pointerEvent('pointerup'))
    await nextTick()
    expect(up).toHaveAttribute('aria-disabled', 'true')
  })

  test('dragging the stepper up raises the value', async () => {
    const { stepper, onChange } = await setup()
    stepper.dispatchEvent(pointerEvent('pointerdown', { screenY: 100 }))
    stepper.dispatchEvent(pointerEvent('pointermove', { screenY: 99 }))
    stepper.dispatchEvent(pointerEvent('pointermove', { screenY: 95 }))
    expect(onChange).toHaveBeenLastCalledWith(54)
  })

  test('disabled blocks typing and stepping', async () => {
    const { input, up, onChange } = await setup({ disabled: true })
    expect(input).toBeDisabled()
    up.dispatchEvent(pointerEvent('pointerdown'))
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
