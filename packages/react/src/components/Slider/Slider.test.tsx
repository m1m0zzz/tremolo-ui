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
    input: screen.getByRole('slider'),
    onChange,
  }
}

function drag(root: Element) {
  act(() => {
    root.dispatchEvent(pointerEvent('pointerdown', 20))
    root.dispatchEvent(pointerEvent('pointerup', 20))
  })
}

describe('Slider state attributes', () => {
  test('every part says which way the slider runs', () => {
    const { root } = setup()

    // The attribute is the styling contract, so it names the orientation
    // rather than answering "is it vertical".
    expect(root).toHaveAttribute('data-orientation', 'horizontal')
    expect(screen.getByTestId('track')).toHaveAttribute(
      'data-orientation',
      'horizontal',
    )
  })

  test('and says so when it runs vertically', () => {
    const { root } = setup({ vertical: true })

    expect(root).toHaveAttribute('data-orientation', 'vertical')
    expect(screen.getByTestId('track')).toHaveAttribute(
      'data-orientation',
      'vertical',
    )
  })
})

describe('Slider input guards', () => {
  test('focus reaching the root is handed to the thumb input', () => {
    const { root, input } = setup()

    // A press lands on the track or the thumb, which the browser answers by
    // clearing the focus unless something there can take it.
    expect(root).toHaveAttribute('tabindex', '-1')
    act(() => (root as HTMLElement).focus())

    expect(document.activeElement).toBe(input)
  })

  test('disabled blocks every input and removes the thumb from the tab order', () => {
    const { root, input, onChange } = setup({ disabled: true })

    fireEvent.keyDown(root, { key: 'ArrowRight' })
    drag(root)
    act(() => input.focus())
    fireEvent.wheel(root, { deltaY: -1 })

    expect(onChange).not.toHaveBeenCalled()
    expect(root).toHaveAttribute('data-disabled')
    expect(input).toBeDisabled()
  })

  test('readonly blocks every input while leaving the thumb focusable', () => {
    const { root, input, onChange } = setup({ readonly: true })

    fireEvent.keyDown(root, { key: 'ArrowRight' })
    drag(root)
    act(() => input.focus())
    fireEvent.wheel(root, { deltaY: -1 })

    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveAttribute('aria-readonly', 'true')
    expect(input).not.toBeDisabled()
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
      ({ root, input }: ReturnType<typeof setup>) => {
        act(() => input.focus())
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
    const { root, input, onChange } = setup(props)
    act(() => input.focus())

    fireEvent.wheel(root, delta)

    expect(onChange).toHaveBeenLastCalledWith(value)
  })
})

describe('Slider accessibility', () => {
  test('puts slider semantics and focus on the range input inside the thumb', () => {
    render(
      <Slider.Root
        value={50}
        min={0}
        max={100}
        vertical
        aria-label="Levels"
        data-testid="root"
      >
        <Slider.Track>
          <Slider.Thumb
            aria-label="Level"
            aria-valuetext="half"
            data-testid="thumb"
          />
        </Slider.Track>
      </Slider.Root>,
    )
    const root = screen.getByTestId('root')
    const thumb = screen.getByTestId('thumb')
    const input = screen.getByRole('slider')

    expect(root).toHaveAttribute('role', 'group')
    expect(root).toHaveAccessibleName('Levels')
    expect(input).toHaveAttribute('type', 'range')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
    expect(input).toHaveValue('50')
    expect(input).toHaveAttribute('aria-orientation', 'vertical')
    expect(input).toHaveAccessibleName('Level')
    expect(input).toHaveAttribute('aria-valuetext', 'half')
    expect(thumb).toContainElement(input)
  })

  test('accepts value changes dispatched by assistive technology', () => {
    const { input, onChange } = setup()

    fireEvent.change(input, { target: { value: '75' } })

    expect(onChange).toHaveBeenLastCalledWith(75)
  })
})
