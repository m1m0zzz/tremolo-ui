import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

import { pointerEvent, withPointerCapture } from '../../helpers'

import NumberInputFixture from './NumberInputFixture.svelte'

function setup(props: Record<string, unknown> = {}) {
  const onChange = vi.fn()
  render(NumberInputFixture, { props: { onChange, ...props } })
  const input = screen.getByRole('spinbutton') as HTMLInputElement
  const up = screen.getByRole('button', { name: 'Increment' })
  const down = screen.getByRole('button', { name: 'Decrement' })
  const stepper = screen.getByTestId('stepper')
  withPointerCapture(stepper)
  return { input, up, down, stepper, onChange }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('NumberInput', () => {
  test('shows the formatted value, with the value in ARIA', () => {
    const { input } = setup({ format: (v: number) => `${v} Hz` })
    expect(input).toHaveValue('50 Hz')
    expect(input).toHaveAttribute('aria-valuenow', '50')
    expect(input).toHaveAttribute('aria-valuetext', '50 Hz')
  })

  test('typing reports the number unclamped, and blur commits it clamped', async () => {
    const { input, onChange } = setup({ min: 0, max: 100 })
    input.focus()
    await fireEvent.input(input, { target: { value: '1500' } })
    expect(onChange).toHaveBeenLastCalledWith(1500)
    await fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(100)
    expect(input).toHaveValue('100')
  })

  test('text with no number goes back to what was shown', async () => {
    const { input } = setup()
    await fireEvent.input(input, { target: { value: 'abc' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(input).toHaveValue('50')
  })

  test('arrow keys step the value', async () => {
    const { input, onChange } = setup()
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(51)
  })

  test('keepCaretOnStep keeps the caret at the same digit', async () => {
    const { input } = setup({ value: 9.9, step: 0.1, keepCaretOnStep: true })
    input.focus()
    input.setSelectionRange(1, 1)
    await fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })
    await tick()
    await tick()
    // 9|.9 -> 10|: still in front of where the point is.
    expect(input).toHaveValue('10')
    expect(input.selectionStart).toBe(2)
  })

  test('selectOnFocus number selects the leading number', async () => {
    const { input } = setup({
      selectOnFocus: 'number',
      format: (v: number) => `${v} Hz`,
    })
    input.focus()
    await fireEvent.focus(input)
    await tick()
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 2])
  })

  test('the stepper buttons repeat while held and stop at the ends', async () => {
    vi.useFakeTimers()
    const { up, onChange } = setup({ max: 52 })
    up.dispatchEvent(pointerEvent('pointerdown'))
    expect(onChange).toHaveBeenLastCalledWith(51)
    vi.advanceTimersByTime(500)
    expect(onChange).toHaveBeenLastCalledWith(52)
    window.dispatchEvent(pointerEvent('pointerup'))
    await tick()
    expect(up).toHaveAttribute('aria-disabled', 'true')
  })

  test('dragging the stepper up raises the value', async () => {
    const { stepper, onChange } = setup()
    stepper.dispatchEvent(
      pointerEvent('pointerdown', { screenY: 100, clientY: 100 }),
    )
    stepper.dispatchEvent(
      pointerEvent('pointermove', { screenY: 99, clientY: 99 }),
    )
    stepper.dispatchEvent(
      pointerEvent('pointermove', { screenY: 95, clientY: 95 }),
    )
    expect(onChange).toHaveBeenLastCalledWith(54)
  })

  test('the wheel acts while the field has focus', async () => {
    const { input, onChange } = setup()
    input.focus()
    await fireEvent.wheel(input, { deltaY: -100 })
    expect(onChange).toHaveBeenLastCalledWith(51)
  })

  test('disabled blocks typing and stepping', async () => {
    const { input, up, onChange } = setup({ disabled: true })
    expect(input).toBeDisabled()
    up.dispatchEvent(pointerEvent('pointerdown'))
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
