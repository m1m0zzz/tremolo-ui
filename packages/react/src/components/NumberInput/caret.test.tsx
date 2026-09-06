import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { unitFormat } from '@tremolo-ui/functions'

import { NumberInputFieldProps } from './InputField'

import { NumberInput, NumberInputProps } from '.'

function Subject({
  initial = 0,
  field,
  ...props
}: {
  initial?: number
  field?: NumberInputFieldProps
} & Omit<NumberInputProps, 'value' | 'children'>) {
  const [value, setValue] = useState(initial)
  return (
    <NumberInput.Root {...props} value={value} onChange={setValue}>
      <NumberInput.InputField {...field} />
    </NumberInput.Root>
  )
}

const input = () => screen.getByRole('spinbutton') as HTMLInputElement

/** Put the caret at `at`, then step. */
function step(at: number, key: 'ArrowUp' | 'ArrowDown', init = {}) {
  input().setSelectionRange(at, at)
  fireEvent.keyDown(input(), { key, ...init })
}

describe('keepCaretOnStep', () => {
  test('is off by default, and the caret lands at the end', () => {
    render(<Subject initial={1234.5} step={0.1} keyboard={['raw', 0.1]} />)

    step(2, 'ArrowUp')

    expect(input().value).toBe('1234.6')
    expect(input().selectionStart).toBe('1234.6'.length)
  })

  test('holds the column the caret was in', () => {
    render(
      <Subject
        initial={1234.5}
        step={0.1}
        keyboard={['raw', 0.1]}
        field={{ keepCaretOnStep: true }}
      />,
    )

    step(2, 'ArrowUp')

    expect(input().value).toBe('1234.6')
    expect(input().selectionStart).toBe(2)
  })

  test('holds it across a repeated step', () => {
    render(
      <Subject
        initial={1234.5}
        step={0.1}
        keyboard={['raw', 0.1]}
        field={{ keepCaretOnStep: true }}
      />,
    )

    step(2, 'ArrowUp')
    fireEvent.keyDown(input(), { key: 'ArrowUp' })

    expect(input().value).toBe('1234.7')
    expect(input().selectionStart).toBe(2)
  })

  test('follows the decimal point when the number grows', () => {
    // '9.9' -> '10.0': a character appears in front, so an offset measured
    // from the start would slide onto the wrong digit.
    render(
      <Subject
        initial={9.9}
        step={0.1}
        max={100}
        keyboard={['raw', 0.1]}
        field={{ keepCaretOnStep: true }}
      />,
    )

    // Between the 9 and the point: the units column.
    step(1, 'ArrowUp')

    expect(input().value).toBe('10')
    // Still the units column, now one character further along.
    expect(input().selectionStart).toBe(2)
  })

  test('follows it when the number shrinks', () => {
    render(<Subject initial={10} step={1} field={{ keepCaretOnStep: true }} />)

    // Between the 1 and the 0: the tens column.
    step(1, 'ArrowDown')

    expect(input().value).toBe('9')
    expect(input().selectionStart).toBe(0)
  })

  test('stays inside the number when the format adds a unit', () => {
    render(
      <Subject
        initial={1230}
        step={10}
        keyboard={['raw', 10]}
        {...unitFormat('Hz', { digits: 2 })}
        field={{ keepCaretOnStep: true }}
      />,
    )

    expect(input().value).toBe('1.23kHz')
    step(6, 'ArrowUp')

    // Clamped to the end of the number rather than left inside 'kHz'.
    expect(input().selectionStart).toBe('1.24'.length)
  })

  test('leaves the caret alone when the value is clamped', () => {
    render(
      <Subject
        initial={10}
        min={0}
        max={10}
        step={1}
        field={{ keepCaretOnStep: true }}
      />,
    )

    step(1, 'ArrowUp')

    expect(input().value).toBe('10')
    expect(input().selectionStart).toBe(1)
  })

  test('typing after a step does not drag the caret back', () => {
    render(
      <Subject
        initial={1234.5}
        step={0.1}
        keyboard={['raw', 0.1]}
        field={{ keepCaretOnStep: true }}
      />,
    )

    step(2, 'ArrowUp')
    fireEvent.change(input(), { target: { value: '7' } })

    expect(input().value).toBe('7')
  })

  test('an IME conversion is left to the IME', () => {
    const onChange = vi.fn()
    render(
      <Subject
        initial={5}
        step={1}
        onChange={onChange}
        field={{ keepCaretOnStep: true }}
      />,
    )

    fireEvent.keyDown(input(), { key: 'ArrowUp', isComposing: true })

    expect(onChange).not.toHaveBeenCalled()
    expect(input().value).toBe('5')
  })
})
