import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { unitFormat } from '@tremolo-ui/functions'

import { NumberInputFieldProps } from './InputField'

import { NumberInput, NumberInputProps } from '.'

function Subject({
  initial = 0,
  onChange,
  field,
  ...props
}: {
  initial?: number
  onChange?: (v: number) => void
  field?: NumberInputFieldProps
} & Omit<NumberInputProps, 'value' | 'children'>) {
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
      <NumberInput.InputField {...field} />
    </NumberInput.Root>
  )
}

const input = () => screen.getByRole('spinbutton') as HTMLInputElement

/** Hertz scales, so the displayed number is not the value. */
const hz = unitFormat('Hz', { digits: 2 })

describe('unformatOnFocus', () => {
  test('is off by default, so the format survives focus', () => {
    render(<Subject initial={1230} {...hz} />)

    expect(input().value).toBe('1.23kHz')
    fireEvent.focus(input())
    expect(input().value).toBe('1.23kHz')
  })

  test('shows the plain value while focused and formats again on blur', () => {
    render(<Subject initial={1230} {...hz} field={{ unformatOnFocus: true }} />)

    expect(input().value).toBe('1.23kHz')

    fireEvent.focus(input())
    expect(input().value).toBe('1230')

    fireEvent.blur(input())
    expect(input().value).toBe('1.23kHz')
  })

  test('shows the value, not the number inside the formatted text', () => {
    // '1.23' would read back as 1.23 and lose a factor of a thousand.
    render(<Subject initial={1230} {...hz} field={{ unformatOnFocus: true }} />)

    fireEvent.focus(input())

    expect(input().value).toBe('1230')
  })

  test('taking focus and leaving again commits nothing', () => {
    const onChange = jest.fn()
    render(
      <Subject
        initial={1230}
        {...hz}
        onChange={onChange}
        field={{ unformatOnFocus: true }}
      />,
    )

    fireEvent.focus(input())
    fireEvent.blur(input())

    expect(onChange).not.toHaveBeenCalled()
  })

  test('a rounded display does not become the value', () => {
    // 1.6 shows as '2Hz'. Editing that text used to commit 2.
    const onChange = jest.fn()
    render(
      <Subject
        initial={1.6}
        {...unitFormat('Hz', { prefixes: false, digits: 0 })}
        onChange={onChange}
        field={{ unformatOnFocus: true }}
      />,
    )

    expect(input().value).toBe('2Hz')

    fireEvent.focus(input())
    expect(input().value).toBe('1.6')

    fireEvent.blur(input())
    expect(onChange).not.toHaveBeenCalled()
    expect(input().value).toBe('2Hz')
  })

  test('typing takes over from the plain value', () => {
    render(<Subject initial={1230} {...hz} field={{ unformatOnFocus: true }} />)

    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: '44' } })

    expect(input().value).toBe('44')

    // Emptying the field is a draft too, not a reason to fall back.
    fireEvent.change(input(), { target: { value: '' } })
    expect(input().value).toBe('')
  })

  test('arrow keys leave the field unformatted while it holds focus', () => {
    render(
      <Subject
        initial={1230}
        step={10}
        keyboard={['raw', 10]}
        {...hz}
        field={{ unformatOnFocus: true }}
      />,
    )

    fireEvent.focus(input())
    fireEvent.keyDown(input(), { key: 'ArrowUp' })

    expect(input().value).toBe('1240')
  })
})

describe('selectOnFocus', () => {
  test('none leaves the selection alone', () => {
    render(<Subject initial={1230} {...hz} />)

    fireEvent.focus(input())

    expect(input().selectionStart).toBe(input().selectionEnd)
  })

  test('all covers the whole text', () => {
    render(<Subject initial={1230} {...hz} field={{ selectOnFocus: 'all' }} />)

    fireEvent.focus(input())

    expect(input().selectionStart).toBe(0)
    expect(input().selectionEnd).toBe('1.23kHz'.length)
  })

  test('number stops where the unit begins', () => {
    render(
      <Subject initial={1230} {...hz} field={{ selectOnFocus: 'number' }} />,
    )

    fireEvent.focus(input())

    expect(input().selectionStart).toBe(0)
    expect(input().selectionEnd).toBe('1.23'.length)
  })

  test('selects the plain value when the format is dropped', () => {
    // The selection is applied after the text is swapped, so it covers the
    // number that is actually there rather than the formatted one.
    render(
      <Subject
        initial={1230}
        {...hz}
        field={{ selectOnFocus: 'number', unformatOnFocus: true }}
      />,
    )

    fireEvent.focus(input())

    expect(input().value).toBe('1230')
    expect(input().selectionEnd).toBe('1230'.length)
  })
})
