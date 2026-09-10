import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { Slider, type SliderProps } from '.'

function pointerEvent(type: string, clientX: number) {
  const event = new MouseEvent(type, { bubbles: true, clientX })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event
}

function Subject({
  onChange,
  ...props
}: Omit<SliderProps, 'value' | 'min' | 'max' | 'children'>) {
  const [value, setValue] = useState(50)
  return (
    <Slider.Root
      value={value}
      min={0}
      max={100}
      data-testid="root"
      {...props}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    >
      <Slider.Track data-testid="track">
        <Slider.Thumb data-testid="thumb" />
      </Slider.Track>
    </Slider.Root>
  )
}

function setup(props: Parameters<typeof Subject>[0] = {}) {
  const onChange = vi.fn()
  const { container } = render(<Subject {...props} onChange={onChange} />)
  for (const element of [container, ...container.querySelectorAll('*')]) {
    Object.assign(element, {
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => true,
      getBoundingClientRect: () =>
        ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        }) as DOMRect,
    })
  }
  return {
    root: screen.getByTestId('root'),
    thumb: screen.getByTestId('thumb'),
    onChange,
  }
}

function drag(root: Element) {
  act(() => {
    root.dispatchEvent(pointerEvent('pointerdown', 20))
    root.dispatchEvent(pointerEvent('pointerup', 20))
  })
}

describe('Slider input guards', () => {
  test('disabled blocks every input and removes the thumb from the tab order', () => {
    const { root, thumb, onChange } = setup({ disabled: true })

    fireEvent.keyDown(root, { key: 'ArrowRight' })
    drag(root)
    act(() => thumb.focus())
    fireEvent.wheel(root, { deltaY: -1 })

    expect(onChange).not.toHaveBeenCalled()
    expect(root).toHaveAttribute('aria-disabled', 'true')
    expect(thumb).toHaveAttribute('tabindex', '-1')
  })

  test('readonly blocks every input while leaving the thumb focusable', () => {
    const { root, thumb, onChange } = setup({ readonly: true })

    fireEvent.keyDown(root, { key: 'ArrowRight' })
    drag(root)
    act(() => thumb.focus())
    fireEvent.wheel(root, { deltaY: -1 })

    expect(onChange).not.toHaveBeenCalled()
    expect(thumb).toHaveAttribute('tabindex', '0')
  })

  test.each([
    [
      'keyboard',
      ({ root }: ReturnType<typeof setup>) =>
        fireEvent.keyDown(root, { key: 'ArrowRight' }),
    ],
    ['pointer', ({ root }: ReturnType<typeof setup>) => drag(root)],
    [
      'wheel',
      ({ root, thumb }: ReturnType<typeof setup>) => {
        act(() => thumb.focus())
        fireEvent.wheel(root, { deltaY: -1 })
      },
    ],
  ])('%s changes an enabled, writable slider', (_name, input) => {
    const subject = setup()

    input(subject)

    expect(subject.onChange).toHaveBeenCalled()
  })
})

describe('Slider wheel direction', () => {
  test.each([
    ['horizontal', {}, { deltaY: -1 }, 51],
    ['reversed horizontal', { reverse: true }, { deltaY: -1 }, 49],
    ['reversed horizontal deltaX', { reverse: true }, { deltaX: 1 }, 49],
    ['vertical', { vertical: true }, { deltaY: -1 }, 51],
    [
      'reversed vertical',
      { vertical: true, reverse: true },
      { deltaY: -1 },
      49,
    ],
  ])('%s slider follows its visual direction', (_name, props, delta, value) => {
    const { root, thumb, onChange } = setup(props)
    act(() => thumb.focus())

    fireEvent.wheel(root, delta)

    expect(onChange).toHaveBeenLastCalledWith(value)
  })
})
