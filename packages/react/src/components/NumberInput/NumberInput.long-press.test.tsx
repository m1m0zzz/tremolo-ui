import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { NumberInput } from '.'

function pointerEvent(type: string) {
  const event = new MouseEvent(type, { bubbles: true, button: 0 })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event
}

function Subject() {
  const [value, setValue] = useState(0)
  return (
    <NumberInput.Root value={value} step={1} onChange={setValue}>
      <NumberInput.InputField />
      <NumberInput.Stepper>
        <NumberInput.IncrementStepper />
      </NumberInput.Stepper>
    </NumberInput.Root>
  )
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('NumberInput stepper long press', () => {
  test('repeats after the initial delay and resets that delay after release', () => {
    render(<Subject />)
    const increment = screen.getByRole('button', { name: 'Increment' })
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    act(() => increment.dispatchEvent(pointerEvent('pointerdown')))
    expect(input.value).toBe('1')

    act(() => vi.advanceTimersByTime(499))
    expect(input.value).toBe('1')
    act(() => vi.advanceTimersByTime(1))
    expect(input.value).toBe('2')
    act(() => vi.advanceTimersByTime(40))
    expect(input.value).toBe('3')

    act(() => window.dispatchEvent(pointerEvent('pointerup')))
    act(() => vi.advanceTimersByTime(200))
    expect(input.value).toBe('3')

    act(() => increment.dispatchEvent(pointerEvent('pointerdown')))
    expect(input.value).toBe('4')
    act(() => vi.advanceTimersByTime(499))
    expect(input.value).toBe('4')
    act(() => vi.advanceTimersByTime(1))
    expect(input.value).toBe('5')
  })
})
