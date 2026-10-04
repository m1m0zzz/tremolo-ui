import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { Knob, type KnobProps } from '.'

// jsdom has no PointerEvent and no pointer capture, so both are faked here.
function pointerEvent(type: string, screenY: number) {
  const event = new MouseEvent(type, { bubbles: true, screenY })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event
}

function Subject({
  onChange,
  ...props
}: Omit<KnobProps, 'value' | 'min' | 'max' | 'children'>) {
  const [value, setValue] = useState(50)

  return (
    <Knob.Root
      value={value}
      min={0}
      max={100}
      data-testid="knob"
      {...props}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    >
      <Knob.SVGRoot>
        <Knob.Thumb />
      </Knob.SVGRoot>
    </Knob.Root>
  )
}

function setup(props: Parameters<typeof Subject>[0] = {}) {
  const onChange = vi.fn()
  const { container } = render(<Subject {...props} onChange={onChange} />)
  const knob = screen.getByTestId('knob')
  Object.assign(knob, {
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    hasPointerCapture: () => true,
  })
  return { container, knob, onChange }
}

function drag(knob: Element) {
  act(() => {
    knob.dispatchEvent(pointerEvent('pointerdown', 100))
    knob.dispatchEvent(pointerEvent('pointermove', 90))
    knob.dispatchEvent(pointerEvent('pointerup', 90))
  })
}

function useEveryInput(knob: HTMLElement) {
  fireEvent.keyDown(knob, { key: 'ArrowUp' })
  drag(knob)
  act(() => knob.focus())
  fireEvent.wheel(knob, { deltaY: -1 })
  fireEvent.doubleClick(knob)
}

describe('Knob double click', () => {
  test('restores resetValue', () => {
    const { knob, onChange } = setup({ resetValue: 20 })

    fireEvent.doubleClick(knob)

    expect(onChange).toHaveBeenLastCalledWith(20)
  })

  test('resetValue defaults to startValue', () => {
    const { knob, onChange } = setup({ startValue: 30 })

    fireEvent.doubleClick(knob)

    expect(onChange).toHaveBeenLastCalledWith(30)
  })

  test('resetValue null turns it off', () => {
    const { knob, onChange } = setup({ resetValue: null })

    fireEvent.doubleClick(knob)

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Knob input guards', () => {
  test('disabled blocks every input and removes the knob from the tab order', () => {
    const { knob, onChange } = setup({ disabled: true })

    useEveryInput(knob)

    expect(onChange).not.toHaveBeenCalled()
    expect(knob).toHaveAttribute('data-disabled')
    expect(knob).toHaveAttribute('tabindex', '-1')
  })

  test('readOnly also blocks double-click while leaving the knob focusable', () => {
    const { knob, onChange } = setup({ readOnly: true })

    fireEvent.doubleClick(knob)

    expect(onChange).not.toHaveBeenCalled()
    expect(knob).toHaveAttribute('data-readonly')
    expect(knob).toHaveAttribute('tabindex', '0')
  })

  test.each([
    [
      'keyboard',
      (knob: HTMLElement) => fireEvent.keyDown(knob, { key: 'ArrowUp' }),
    ],
    ['pointer', (knob: HTMLElement) => drag(knob)],
    [
      'wheel',
      (knob: HTMLElement) => {
        act(() => knob.focus())
        fireEvent.wheel(knob, { deltaY: -1 })
      },
    ],
    ['double-click', (knob: HTMLElement) => fireEvent.doubleClick(knob)],
  ])('%s changes an enabled, writable knob', (_name, input) => {
    const { knob, onChange } = setup()

    input(knob)

    expect(onChange).toHaveBeenCalled()
  })
})
