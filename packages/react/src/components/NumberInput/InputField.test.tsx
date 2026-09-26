import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { NumberInput } from '.'

const input = () => screen.getByRole('spinbutton') as HTMLInputElement

describe('the handlers passed to InputField', () => {
  test('run after its own, which still draft and commit the text', () => {
    const calls: string[] = []
    const onValue = vi.fn()

    function Subject() {
      const [value, setValue] = useState(0)
      return (
        <NumberInput.Root
          value={value}
          onChange={(v) => {
            setValue(v)
            onValue(v)
          }}
        >
          <NumberInput.InputField
            onChange={(event) =>
              calls.push(`change ${event.currentTarget.value}`)
            }
            onFocus={() => calls.push('focus')}
            onBlur={() => calls.push('blur')}
            onKeyDown={(event) => calls.push(`keydown ${event.key}`)}
          />
        </NumberInput.Root>
      )
    }
    render(<Subject />)

    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: '42' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    fireEvent.blur(input())

    expect(calls).toEqual(['focus', 'change 42', 'keydown Enter', 'blur'])
    expect(onValue).toHaveBeenCalledWith(42)
    expect(input().value).toBe('42')
  })
})
