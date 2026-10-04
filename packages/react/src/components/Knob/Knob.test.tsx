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

describe('Knob change gesture', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function events() {
    const log: unknown[][] = []
    return {
      log,
      onChangeStart: vi.fn((...args) => log.push(['start', ...args])),
      onChangeEnd: vi.fn((...args) => log.push(['end', ...args])),
    }
  }

  test('a drag starts before its first value and ends after its last', () => {
    const { onChangeStart, onChangeEnd } = events()
    const { knob, onChange } = setup({ onChangeStart, onChangeEnd })

    drag(knob)

    expect(onChangeStart).toHaveBeenCalledWith(50, 'pointer')
    expect(onChangeEnd).toHaveBeenCalledWith(
      onChange.mock.lastCall?.[0],
      'pointer',
    )
    expect(onChangeStart.mock.invocationCallOrder[0]).toBeLessThan(
      onChange.mock.invocationCallOrder[0],
    )
    expect(onChange.mock.invocationCallOrder.at(-1)).toBeLessThan(
      onChangeEnd.mock.invocationCallOrder[0],
    )
  })

  test('the wheel ends changeEndDelay after the last notch', () => {
    vi.useFakeTimers()
    const { onChangeStart, onChangeEnd } = events()
    const { knob, onChange } = setup({
      onChangeStart,
      onChangeEnd,
      changeEndDelay: 200,
    })
    act(() => knob.focus())

    fireEvent.wheel(knob, { deltaY: -1 })
    fireEvent.wheel(knob, { deltaY: -1 })
    expect(onChangeStart).toHaveBeenCalledTimes(1)
    expect(onChangeStart).toHaveBeenCalledWith(50, 'wheel')
    expect(onChangeEnd).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(200))
    expect(onChangeEnd).toHaveBeenCalledWith(
      onChange.mock.lastCall?.[0],
      'wheel',
    )
  })

  test('the arrow keys are a keyboard gesture', () => {
    vi.useFakeTimers()
    const { onChangeStart, onChangeEnd } = events()
    const { knob } = setup({ onChangeStart, onChangeEnd })

    fireEvent.keyDown(knob, { key: 'ArrowUp' })
    act(() => vi.advanceTimersByTime(500))

    expect(onChangeStart).toHaveBeenCalledWith(50, 'keyboard')
    expect(onChangeEnd).toHaveBeenCalledWith(51, 'keyboard')
  })

  test('a double click brackets the reset', () => {
    const { onChangeStart, onChangeEnd } = events()
    const { knob, onChange } = setup({
      resetValue: 20,
      onChangeStart,
      onChangeEnd,
    })

    fireEvent.doubleClick(knob)

    expect(onChangeStart).toHaveBeenCalledWith(50, 'doubleClick')
    expect(onChange).toHaveBeenCalledWith(20)
    expect(onChangeEnd).toHaveBeenCalledWith(20, 'doubleClick')
    const [start, change, end] = [onChangeStart, onChange, onChangeEnd].map(
      (fn) => fn.mock.invocationCallOrder[0],
    )
    expect(start).toBeLessThan(change)
    expect(change).toBeLessThan(end)
  })

  test('nothing starts while disabled', () => {
    const { onChangeStart } = events()
    const { knob } = setup({ disabled: true, onChangeStart })

    useEveryInput(knob)

    expect(onChangeStart).not.toHaveBeenCalled()
  })
})
