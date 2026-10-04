import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { NumberInput, type NumberInputProps } from '.'

function pointerEvent(type: string) {
  const event = new MouseEvent(type, { bubbles: true, button: 0 })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event
}

function Subject({
  onChange,
  ...props
}: { onChange?: (v: number) => void } & Omit<
  NumberInputProps,
  'value' | 'children'
>) {
  const [value, setValue] = useState(5)
  return (
    <NumberInput.Root
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    >
      <NumberInput.InputField />
      <NumberInput.Stepper>
        <NumberInput.IncrementStepper />
      </NumberInput.Stepper>
    </NumberInput.Root>
  )
}

function setup(props: Omit<NumberInputProps, 'value' | 'children'> = {}) {
  const onChange = vi.fn()
  const onChangeStart = vi.fn()
  const onChangeEnd = vi.fn()
  render(
    <Subject
      {...props}
      onChange={onChange}
      onChangeStart={onChangeStart}
      onChangeEnd={onChangeEnd}
    />,
  )
  const input = screen.getByRole('spinbutton') as HTMLInputElement
  return { input, onChange, onChangeStart, onChangeEnd }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('NumberInput change gesture', () => {
  test('a stepper press is held until the pointer is released, repeats included', () => {
    const { onChange, onChangeStart, onChangeEnd } = setup()
    const increment = screen.getByRole('button', { name: 'Increment' })

    act(() => increment.dispatchEvent(pointerEvent('pointerdown')))
    // The press moves the value at once, and the hold repeats it.
    act(() => vi.advanceTimersByTime(600))
    expect(onChange.mock.calls.length).toBeGreaterThan(1)
    expect(onChangeStart).toHaveBeenCalledTimes(1)
    expect(onChangeStart).toHaveBeenCalledWith(5, 'pointer')
    expect(onChangeStart.mock.invocationCallOrder[0]).toBeLessThan(
      onChange.mock.invocationCallOrder[0],
    )
    expect(onChangeEnd).not.toHaveBeenCalled()

    act(() => window.dispatchEvent(pointerEvent('pointerup')))
    expect(onChangeEnd).toHaveBeenCalledWith(
      onChange.mock.lastCall?.[0],
      'pointer',
    )
  })

  test('the arrow keys end changeEndDelay after the last press', () => {
    const { input, onChangeStart, onChangeEnd } = setup({ changeEndDelay: 200 })

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onChangeStart).toHaveBeenCalledTimes(1)
    expect(onChangeStart).toHaveBeenCalledWith(5, 'keyboard')

    act(() => vi.advanceTimersByTime(200))
    expect(onChangeEnd).toHaveBeenCalledWith(7, 'keyboard')
  })

  test('the wheel is a gesture of its own', () => {
    const { input, onChangeStart, onChangeEnd } = setup()
    act(() => input.focus())

    fireEvent.wheel(input, { deltaY: -1 })
    act(() => vi.advanceTimersByTime(500))

    expect(onChangeStart).toHaveBeenCalledWith(5, 'wheel')
    expect(onChangeEnd).toHaveBeenCalledWith(6, 'wheel')
  })

  test('typing starts a gesture, and committing ends it', () => {
    const { input, onChangeStart, onChangeEnd } = setup()

    fireEvent.change(input, { target: { value: '8' } })
    expect(onChangeStart).toHaveBeenCalledWith(5, 'keyboard')
    fireEvent.change(input, { target: { value: '80' } })
    expect(onChangeStart).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChangeEnd).toHaveBeenCalledWith(80, 'keyboard')
  })

  test('nothing starts while read-only', () => {
    const { input, onChangeStart } = setup({ readOnly: true })
    const increment = screen.getByRole('button', { name: 'Increment' })

    act(() => increment.dispatchEvent(pointerEvent('pointerdown')))
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    expect(onChangeStart).not.toHaveBeenCalled()
  })
})
