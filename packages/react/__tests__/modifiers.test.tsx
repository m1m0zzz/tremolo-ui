import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { Knob } from '../src/components/Knob'
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
