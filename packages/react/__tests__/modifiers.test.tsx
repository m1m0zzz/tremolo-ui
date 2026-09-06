import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { Knob } from '../src/components/Knob'
import { NumberInput } from '../src/components/NumberInput'
import { Slider } from '../src/components/Slider'
import { XYPad } from '../src/components/XYPad'

/**
 * The modifier amounts are shared across every component, so one control is
 * enough to pin the wiring; `packages/functions` covers the resolution rules.
 */
function SliderSubject({
  initial = 5,
  onChange,
  ...props
}: {
  initial?: number
  onChange?: (v: number) => void
} & Partial<React.ComponentProps<typeof Slider.Root>>) {
  const [value, setValue] = useState(initial)
  return (
    <Slider.Root
      min={0}
      max={10}
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    >
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
    </Slider.Root>
  )
}

const slider = () => screen.getByRole('slider')

describe('shift as the fine-adjustment key', () => {
  test('is bound on the keyboard by default', () => {
    const onChange = jest.fn()
    render(<SliderSubject onChange={onChange} />)

    fireEvent.keyDown(slider(), { key: 'ArrowUp', shiftKey: true })

    expect(onChange).toHaveBeenLastCalledWith(5.1)
  })

  test('a plain press still moves by one step', () => {
    const onChange = jest.fn()
    render(<SliderSubject onChange={onChange} />)

    fireEvent.keyDown(slider(), { key: 'ArrowUp' })

    expect(onChange).toHaveBeenLastCalledWith(6)
  })

  test('a plain press brings an off-grid value back to the grid', () => {
    const onChange = jest.fn()
    render(<SliderSubject initial={5} onChange={onChange} />)

    fireEvent.keyDown(slider(), { key: 'ArrowUp', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(5.1)

    fireEvent.keyDown(slider(), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(6)
  })

  test('is not bound on the wheel, where the browser takes shift', () => {
    const onChange = jest.fn()
    const { container } = render(<SliderSubject onChange={onChange} />)

    // The wheel listener sits on the root and only acts while the focus is
    // inside, so the thumb has to take it first.
    slider().focus()
    fireEvent.wheel(container.querySelector('.tremolo-slider')!, {
      deltaY: -1,
      shiftKey: true,
    })

    // The default wheel amount, not a tenth of it.
    expect(onChange).toHaveBeenLastCalledWith(6)
  })

  test('a caller can rebind it, or turn it off', () => {
    const onChange = jest.fn()
    render(
      <SliderSubject
        keyboard={{ default: ['raw', 1], alt: ['raw', 0.5] }}
        onChange={onChange}
      />,
    )

    // shift has no entry now, so it falls through to default.
    fireEvent.keyDown(slider(), { key: 'ArrowUp', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(6)

    fireEvent.keyDown(slider(), { key: 'ArrowUp', altKey: true })
    expect(onChange).toHaveBeenLastCalledWith(6.5)
  })

  test('a bare tuple opts out of modifiers entirely', () => {
    const onChange = jest.fn()
    render(<SliderSubject keyboard={['raw', 1]} onChange={onChange} />)

    fireEvent.keyDown(slider(), { key: 'ArrowUp', shiftKey: true })

    expect(onChange).toHaveBeenLastCalledWith(6)
  })
})

describe('the same default reaches the other components', () => {
  test('Knob', () => {
    const onChange = jest.fn()
    const Subject = () => {
      const [value, setValue] = useState(5)
      return (
        <Knob.Root
          min={0}
          max={10}
          value={value}
          onChange={(v) => {
            setValue(v)
            onChange(v)
          }}
        >
          <Knob.SVGRoot>
            <Knob.Thumb />
          </Knob.SVGRoot>
        </Knob.Root>
      )
    }
    render(<Subject />)

    fireEvent.keyDown(screen.getByRole('slider'), {
      key: 'ArrowUp',
      shiftKey: true,
    })

    expect(onChange).toHaveBeenLastCalledWith(5.1)
  })
})

describe('the wheel on a two-dimensional control', () => {
  function XYSubject({
    onChange,
  }: {
    onChange: (v: [number, number]) => void
  }) {
    const [value, setValue] = useState<[number, number]>([5, 5])
    return (
      <XYPad.Root
        min={0}
        max={10}
        value={value}
        onChange={(v) => {
          setValue(v)
          onChange(v)
        }}
      >
        <XYPad.Area>
          <XYPad.Thumb />
        </XYPad.Area>
      </XYPad.Root>
    )
  }

  const fire = (container: HTMLElement, init: Partial<WheelEventInit>) => {
    // The wheel only acts while the focus is inside, and the XYPad thumb is
    // the tab stop rather than a `slider` role.
    container.querySelector<HTMLElement>('.tremolo-xy-pad-thumb')!.focus()
    fireEvent.wheel(container.querySelector('.tremolo-xy-pad')!, init)
  }

  test('shift moves x, and the direction still follows the scroll', () => {
    // Browsers empty deltaY and fill deltaX for shift+wheel. Reading deltaY
    // alone left the direction stuck at +1, so shift could only ever raise x.
    const onChange = jest.fn()
    const { container } = render(<XYSubject onChange={onChange} />)

    fire(container, { deltaX: 1, deltaY: 0, shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith([6, 5])

    fire(container, { deltaX: -1, deltaY: 0, shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith([5, 5])
  })

  test('a horizontal gesture moves x without any modifier', () => {
    const onChange = jest.fn()
    const { container } = render(<XYSubject onChange={onChange} />)

    fire(container, { deltaX: 1, deltaY: 0 })

    expect(onChange).toHaveBeenLastCalledWith([6, 5])
  })

  test('a vertical wheel still moves y', () => {
    const onChange = jest.fn()
    const { container } = render(<XYSubject onChange={onChange} />)

    fire(container, { deltaX: 0, deltaY: 1 })

    expect(onChange).toHaveBeenLastCalledWith([5, 6])
  })
})

describe('shift while dragging a Knob', () => {
  /**
   * jsdom lays nothing out and has no PointerEvent, so the drag is driven
   * through the same helpers the dom tests use: what is asserted here is the
   * wiring, not the arithmetic.
   */
  function KnobSubject({ onChange }: { onChange: (v: number) => void }) {
    const [value, setValue] = useState(50)
    return (
      <Knob.Root
        min={0}
        max={100}
        step={0.01}
        value={value}
        onChange={(v) => {
          setValue(v)
          onChange(v)
        }}
      >
        <Knob.SVGRoot>
          <Knob.Thumb />
        </Knob.SVGRoot>
      </Knob.Root>
    )
  }

  /** jsdom has no PointerEvent and no pointer capture, so both are faked. */
  const pointerEvent = (
    type: string,
    init: { screenY?: number; shiftKey?: boolean } = {},
  ) => {
    const event = new MouseEvent(type, { bubbles: true, screenX: 0, ...init })
    Object.defineProperty(event, 'pointerId', { value: 1 })
    return event
  }

  /** The first point is the pointer going down, the rest are moves. */
  const drag = (
    element: Element,
    points: { screenY: number; shiftKey?: boolean }[],
  ) => {
    Object.assign(element, {
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => true,
    })
    act(() => {
      element.dispatchEvent(pointerEvent('pointerdown', points[0]))
    })
    for (const point of points.slice(1)) {
      act(() => {
        element.dispatchEvent(pointerEvent('pointermove', point))
      })
    }
  }

  test('a plain drag covers the whole range in 100px', () => {
    const onChange = jest.fn()
    const { container } = render(<KnobSubject onChange={onChange} />)
    const knob = container.querySelector('.tremolo-knob')!

    // Dragging up raises the value.
    drag(knob, [{ screenY: 0 }, { screenY: -20 }])

    expect(onChange).toHaveBeenLastCalledWith(70)
  })

  test('shift makes the same movement count a tenth', () => {
    const onChange = jest.fn()
    const { container } = render(<KnobSubject onChange={onChange} />)
    const knob = container.querySelector('.tremolo-knob')!

    // Held before the pointer goes down, so it counts from the first pixel.
    drag(knob, [
      { screenY: 0, shiftKey: true },
      { screenY: -20, shiftKey: true },
    ])

    expect(onChange).toHaveBeenLastCalledWith(52)
  })

  test('pressing shift mid-drag does not move the value', () => {
    const onChange = jest.fn()
    const { container } = render(<KnobSubject onChange={onChange} />)
    const knob = container.querySelector('.tremolo-knob')!

    drag(knob, [
      { screenY: 0 },
      { screenY: -20 },
      // Same position, shift now held. Rescaling the whole travel would drop
      // the value from 70 to 52.
      { screenY: -20, shiftKey: true },
      { screenY: -30, shiftKey: true },
    ])

    expect(onChange).toHaveBeenLastCalledWith(71)
  })
})

describe('shift while dragging a Slider', () => {
  /** jsdom has no PointerEvent and no pointer capture, so both are faked. */
  const pointerEvent = (
    type: string,
    init: { clientX?: number; shiftKey?: boolean } = {},
  ) => {
    const event = new MouseEvent(type, { bubbles: true })
    Object.defineProperty(event, 'pointerId', { value: 1 })
    // MouseEventInit coerces coordinates to integers, so they are defined
    // directly. `screenX` follows `clientX`: only the mapping reads the latter.
    Object.defineProperty(event, 'clientX', { value: init.clientX ?? 0 })
    Object.defineProperty(event, 'screenX', { value: init.clientX ?? 0 })
    Object.defineProperty(event, 'shiftKey', { value: init.shiftKey ?? false })
    return event
  }

  /** The first point is the pointer going down, the rest are moves. */
  const drag = (
    element: Element,
    points: { clientX: number; shiftKey?: boolean }[],
  ) => {
    Object.assign(element, {
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => true,
    })
    act(() => {
      element.dispatchEvent(pointerEvent('pointerdown', points[0]))
    })
    for (const point of points.slice(1)) {
      act(() => {
        element.dispatchEvent(pointerEvent('pointermove', point))
      })
    }
  }

  /** jsdom lays nothing out, so the track is given a rect of 100px. */
  function setup(props?: Partial<React.ComponentProps<typeof Slider.Root>>) {
    const onChange = jest.fn()
    const { container } = render(
      <SliderSubject initial={0} max={100} onChange={onChange} {...props} />,
    )
    const track = container.querySelector('.tremolo-slider-track')!
    track.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 100, bottom: 10 }) as DOMRect
    return { onChange, root: container.querySelector('.tremolo-slider')! }
  }

  test('a plain drag puts the value under the pointer', () => {
    const { onChange, root } = setup()

    drag(root, [{ clientX: 20 }, { clientX: 60 }])

    expect(onChange).toHaveBeenLastCalledWith(60)
  })

  test('shift makes the same movement count a tenth', () => {
    const { onChange, root } = setup()

    // Pressed without the key, then held without moving, then moved.
    drag(root, [
      { clientX: 20 },
      { clientX: 20, shiftKey: true },
      { clientX: 60, shiftKey: true },
    ])

    expect(onChange).toHaveBeenLastCalledWith(24)
  })

  test('pressing the key does not move the value on its own', () => {
    const { onChange, root } = setup()

    drag(root, [{ clientX: 20 }, { clientX: 50 }])
    expect(onChange).toHaveBeenLastCalledWith(50)

    drag(root, [{ clientX: 50 }, { clientX: 50, shiftKey: true }])
    expect(onChange).toHaveBeenLastCalledWith(50)
  })

  test('a bare number opts out of modifiers', () => {
    const { onChange, root } = setup({ dragSensitivity: 1 })

    drag(root, [
      { clientX: 20 },
      { clientX: 20, shiftKey: true },
      { clientX: 60, shiftKey: true },
    ])

    expect(onChange).toHaveBeenLastCalledWith(60)
  })
})

describe('shift while dragging a NumberInput Stepper', () => {
  function Subject({
    onChange,
    ...props
  }: { onChange: (v: number) => void } & Partial<
    React.ComponentProps<typeof NumberInput.Root>
  >) {
    const [value, setValue] = useState(5)
    return (
      <NumberInput.Root
        min={0}
        max={100}
        {...props}
        value={value}
        onChange={(v) => {
          setValue(v)
          onChange(v)
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

  /** jsdom has no PointerEvent and no pointer capture, so both are faked. */
  const pointerEvent = (
    type: string,
    init: { screenY?: number; shiftKey?: boolean } = {},
  ) => {
    const event = new MouseEvent(type, { bubbles: true })
    Object.defineProperty(event, 'pointerId', { value: 1 })
    Object.defineProperty(event, 'screenX', { value: 0 })
    Object.defineProperty(event, 'screenY', { value: init.screenY ?? 0 })
    Object.defineProperty(event, 'shiftKey', { value: init.shiftKey ?? false })
    return event
  }

  const drag = (
    element: Element,
    points: { screenY: number; shiftKey?: boolean }[],
  ) => {
    Object.assign(element, {
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => true,
    })
    act(() => {
      element.dispatchEvent(pointerEvent('pointerdown', points[0]))
    })
    for (const point of points.slice(1)) {
      act(() => {
        element.dispatchEvent(pointerEvent('pointermove', point))
      })
    }
  }

  function setup(
    props?: Partial<React.ComponentProps<typeof NumberInput.Root>>,
  ) {
    const onChange = jest.fn()
    const { container } = render(<Subject onChange={onChange} {...props} />)
    return {
      onChange,
      stepper: container.querySelector('.tremolo-number-input-stepper')!,
    }
  }

  test('a plain drag moves one step per pixel', () => {
    const { onChange, stepper } = setup()

    // The first move takes the origin; the second one acts. Dragging up raises
    // the value, as on a knob.
    drag(stepper, [{ screenY: 0 }, { screenY: -1 }, { screenY: -11 }])

    expect(onChange).toHaveBeenLastCalledWith(15)
  })

  test('shift makes the same movement count a tenth', () => {
    const { onChange, stepper } = setup()

    drag(stepper, [
      { screenY: 0 },
      { screenY: -1, shiftKey: true },
      { screenY: -11, shiftKey: true },
    ])

    // Ten pixels at a tenth of a step, and not snapped back onto the grid.
    expect(onChange).toHaveBeenLastCalledWith(6)
  })

  test('pressing the key mid-drag does not move the value', () => {
    const { onChange, stepper } = setup()

    drag(stepper, [{ screenY: 0 }, { screenY: -1 }, { screenY: -11 }])
    expect(onChange).toHaveBeenLastCalledWith(15)

    // Held without the pointer moving. Re-scaling the whole drag would drop
    // the value; the travel so far has to be kept.
    act(() => {
      stepper.dispatchEvent(
        pointerEvent('pointermove', { screenY: -12, shiftKey: true }),
      )
    })
    expect(onChange).toHaveBeenLastCalledWith(15.1)
  })
})
