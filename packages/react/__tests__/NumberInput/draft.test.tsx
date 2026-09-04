import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { NumberInput, NumberInputProps } from '../../src/components/NumberInput'

/** A controlled NumberInput, the way a caller would wire one up. */
function Subject({
  initial = 0,
  onChange,
  ...props
}: { initial?: number; onChange?: (v: number) => void } & Omit<
  NumberInputProps,
  'value' | 'children'
>) {
  const [value, setValue] = useState(initial)
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
        <NumberInput.DecrementStepper />
      </NumberInput.Stepper>
    </NumberInput.Root>
  )
}

const input = () => screen.getByRole('spinbutton') as HTMLInputElement

describe('the editing draft', () => {
  test('shows the formatted value while not editing', () => {
    render(<Subject initial={1234} units="Hz" digit={1} />)

    expect(input().value).toBe('1234.0Hz')
  })

  test('leaves the typed text alone instead of reformatting it', () => {
    const onChange = jest.fn()
    render(<Subject initial={1234} units="Hz" digit={1} onChange={onChange} />)

    fireEvent.change(input(), { target: { value: '15' } })

    // The value follows every keystroke, but the text stays as typed: a format
    // applied here would rewrite '15' to '15.0Hz' under the caret.
    expect(onChange).toHaveBeenCalledWith(15)
    expect(input().value).toBe('15')
  })

  test('keeps half-finished entries that do not parse to a useful value', () => {
    render(<Subject initial={5} />)

    fireEvent.change(input(), { target: { value: '-' } })

    expect(input().value).toBe('-')
  })

  test('typing is not clamped, so a long value can be entered digit by digit', () => {
    const onChange = jest.fn()
    render(<Subject initial={0} min={0} max={100} onChange={onChange} />)

    fireEvent.change(input(), { target: { value: '1' } })
    fireEvent.change(input(), { target: { value: '15' } })
    fireEvent.change(input(), { target: { value: '150' } })

    expect(onChange).toHaveBeenLastCalledWith(150)
    expect(input().value).toBe('150')
  })

  test('blur commits, clamps and reformats', () => {
    const onChange = jest.fn()
    render(
      <Subject initial={0} min={0} max={100} units="Hz" onChange={onChange} />,
    )

    fireEvent.change(input(), { target: { value: '150' } })
    fireEvent.blur(input())

    expect(onChange).toHaveBeenLastCalledWith(100)
    expect(input().value).toBe('100Hz')
  })

  test('Enter commits without waiting for blur', () => {
    const onChange = jest.fn()
    render(<Subject initial={0} min={0} max={100} onChange={onChange} />)

    fireEvent.change(input(), { target: { value: '150' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    expect(onChange).toHaveBeenLastCalledWith(100)
    expect(input().value).toBe('100')
  })

  test('clampValue={false} keeps a value outside the range', () => {
    const onChange = jest.fn()
    render(
      <Subject
        initial={0}
        min={0}
        max={100}
        clampValue={false}
        onChange={onChange}
      />,
    )

    fireEvent.change(input(), { target: { value: '150' } })
    fireEvent.blur(input())

    expect(onChange).toHaveBeenLastCalledWith(150)
    expect(input().value).toBe('150')
    expect(input().getAttribute('data-out-of-range')).toBe('true')
  })

  test('a stepper drops the draft rather than stepping from the typed text', () => {
    render(<Subject initial={0} min={0} max={100} units="Hz" />)

    fireEvent.change(input(), { target: { value: '10' } })
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Increment' }))

    expect(input().value).toBe('11Hz')
  })
})

describe('value changes', () => {
  test('arrow keys step the value', () => {
    render(<Subject initial={5} min={0} max={10} />)

    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    expect(input().value).toBe('6')

    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(input().value).toBe('4')
  })

  test('arrow keys stop at the range', () => {
    render(<Subject initial={10} min={0} max={10} />)

    fireEvent.keyDown(input(), { key: 'ArrowUp' })

    expect(input().value).toBe('10')
  })

  test('normalized mode works with a min of 0', () => {
    // A truthiness check on min used to throw here, see plan 6.4.
    render(
      <Subject initial={0} min={0} max={100} keyboard={['normalized', 0.1]} />,
    )

    fireEvent.keyDown(input(), { key: 'ArrowUp' })

    expect(input().value).toBe('10')
  })

  test('readonly blocks every path', () => {
    const onChange = jest.fn()
    render(
      <Subject initial={5} min={0} max={10} readonly onChange={onChange} />,
    )

    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    fireEvent.change(input(), { target: { value: '9' } })

    expect(onChange).not.toHaveBeenCalled()
    expect(input().value).toBe('5')
  })
})

describe('accessibility', () => {
  test('the input carries the spinbutton range', () => {
    render(<Subject initial={5} min={0} max={10} units="Hz" />)

    expect(input().getAttribute('aria-valuenow')).toBe('5')
    expect(input().getAttribute('aria-valuemin')).toBe('0')
    expect(input().getAttribute('aria-valuemax')).toBe('10')
    expect(input().getAttribute('aria-valuetext')).toBe('5Hz')
  })

  test('an unbounded input reports no range', () => {
    render(<Subject initial={5} />)

    expect(input().hasAttribute('aria-valuemin')).toBe(false)
    expect(input().hasAttribute('aria-valuemax')).toBe(false)
  })

  test('the input is the tab stop, not the wrapper', () => {
    const { container } = render(<Subject initial={5} />)

    const root = container.querySelector('.tremolo-number-input')
    expect(root?.hasAttribute('tabindex')).toBe(false)
    expect(input().hasAttribute('tabindex')).toBe(false)
  })
})
