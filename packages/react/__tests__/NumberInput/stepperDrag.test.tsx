import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { NumberInput, NumberInputProps } from '../../src/components/NumberInput'

// jsdom has no PointerEvent and no pointer capture, so both are faked here.
function pointerEvent(type: string, screenY = 0) {
  const event = new MouseEvent(type, { bubbles: true, screenY })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event
}

function fakePointerCapture(container: Element) {
  for (const element of [container, ...container.querySelectorAll('*')]) {
    Object.assign(element, {
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => true,
    })
  }
}

/** `screenY` grows downwards, so a smaller value is a drag upwards. */
function dragY(element: Element, positions: number[]) {
  act(() => {
    element.dispatchEvent(pointerEvent('pointerdown', positions[0]))
  })
  for (const y of positions.slice(1)) {
    act(() => {
      element.dispatchEvent(pointerEvent('pointermove', y))
    })
  }
}

function Subject({
  initial = 0,
  ...props
}: { initial?: number } & Omit<NumberInputProps, 'value' | 'children'>) {
  const [value, setValue] = useState(initial)
  return (
    <NumberInput.Root {...props} value={value} onChange={setValue}>
      <NumberInput.InputField />
      <NumberInput.Stepper data-testid="stepper">
        <NumberInput.IncrementStepper />
        <NumberInput.DecrementStepper />
      </NumberInput.Stepper>
    </NumberInput.Root>
  )
}

const input = () => screen.getByRole('spinbutton') as HTMLInputElement

describe('dragging the Stepper', () => {
  test('moves one step every `drag` pixels, upwards', () => {
    const { container } = render(<Subject initial={0} />)
    fakePointerCapture(container)

    // The first move only fixes the origin, so the value follows from there.
    dragY(screen.getByTestId('stepper'), [100, 99, 89])

    expect(input().value).toBe('10')
  })

  test('dragging down lowers the value', () => {
    const { container } = render(<Subject initial={50} />)
    fakePointerCapture(container)

    dragY(screen.getByTestId('stepper'), [100, 101, 121])

    expect(input().value).toBe('30')
  })

  test('works without min and max', () => {
    const { container } = render(<Subject initial={0} />)
    fakePointerCapture(container)

    dragY(screen.getByTestId('stepper'), [0, -1, -501])

    expect(input().value).toBe('500')
  })

  test('`drag` sets the pixels one step takes', () => {
    const { container } = render(<Subject initial={0} drag={10} />)
    fakePointerCapture(container)

    dragY(screen.getByTestId('stepper'), [100, 99, 59])

    expect(input().value).toBe('4')
  })

  test('moves by `step`, staying on its grid', () => {
    const { container } = render(<Subject initial={0} step={0.5} />)
    fakePointerCapture(container)

    dragY(screen.getByTestId('stepper'), [100, 99, 96])

    expect(input().value).toBe('1.5')
  })

  test('stops at the range', () => {
    const { container } = render(<Subject initial={0} min={0} max={5} />)
    fakePointerCapture(container)

    dragY(screen.getByTestId('stepper'), [100, 99, 79])

    expect(input().value).toBe('5')
  })

  test('counts from where the drag started, not from the value it last set', () => {
    const { container } = render(<Subject initial={0} />)
    fakePointerCapture(container)

    // Reporting each move relative to the previous value would compound the
    // travel; it is measured from the origin instead.
    dragY(screen.getByTestId('stepper'), [100, 99, 94, 89, 84])

    expect(input().value).toBe('15')
  })

  test('drag={null} leaves the steppers alone', () => {
    const { container } = render(<Subject initial={0} drag={null} />)
    fakePointerCapture(container)

    dragY(screen.getByTestId('stepper'), [100, 99, 89])

    expect(input().value).toBe('0')
  })

  test('readonly blocks the drag', () => {
    const { container } = render(<Subject initial={0} readonly />)
    fakePointerCapture(container)

    dragY(screen.getByTestId('stepper'), [100, 99, 89])

    expect(input().value).toBe('0')
  })

  test('the press that starts the drag still counts as one nudge', () => {
    const { container } = render(<Subject initial={0} />)
    fakePointerCapture(container)

    const increment = screen.getByRole('button', { name: 'Increment' })
    act(() => {
      increment.dispatchEvent(pointerEvent('pointerdown', 100))
    })
    expect(input().value).toBe('1')

    // The drag carries on from the nudged value rather than discarding it.
    act(() => {
      increment.dispatchEvent(pointerEvent('pointermove', 99))
    })
    act(() => {
      increment.dispatchEvent(pointerEvent('pointermove', 94))
    })
    expect(input().value).toBe('6')
  })
})
