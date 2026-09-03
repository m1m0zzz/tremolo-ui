import { act, render } from '@testing-library/react'
import { useState } from 'react'

import { Knob } from '../src/components/Knob'
import { Slider } from '../src/components/Slider'
import { XYPad } from '../src/components/XYPad'

// jsdom has no PointerEvent and no pointer capture, so both are faked here.
function pointerEvent(
  type: string,
  init: {
    screenX?: number
    screenY?: number
    clientX?: number
    clientY?: number
  } = {},
) {
  const event = new MouseEvent(type, { bubbles: true, ...init })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event
}

/** jsdom lays nothing out, so every element is given the same 100x100 rect. */
function fakeLayout(container: Element) {
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
}

function drag(
  root: Element,
  points: {
    clientX?: number
    clientY?: number
    screenX?: number
    screenY?: number
  }[],
) {
  act(() => {
    root.dispatchEvent(pointerEvent('pointerdown', points[0]))
  })
  for (const point of points.slice(1)) {
    act(() => {
      root.dispatchEvent(pointerEvent('pointermove', point))
    })
  }
}

function SliderSubject(props: { vertical?: boolean; reverse?: boolean }) {
  const [value, setValue] = useState(0)
  return (
    <Slider.Root
      {...props}
      value={value}
      min={0}
      max={100}
      data-testid="root"
      data-value={value}
      onChange={setValue}
    >
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
    </Slider.Root>
  )
}

describe('Slider', () => {
  test('jumps to the position clicked and follows the pointer', () => {
    const { getByTestId, container } = render(<SliderSubject />)
    fakeLayout(container)
    const root = getByTestId('root')

    drag(root, [{ clientX: 30 }, { clientX: 80, screenX: 50 }])

    expect(root.dataset.value).toBe('80')
  })

  test('a vertical slider takes its value from the y axis, upwards', () => {
    const { getByTestId, container } = render(<SliderSubject vertical />)
    fakeLayout(container)
    const root = getByTestId('root')

    drag(root, [{ clientY: 25 }])

    expect(root.dataset.value).toBe('75')
  })

  test('reverse flips the axis', () => {
    const { getByTestId, container } = render(<SliderSubject reverse />)
    fakeLayout(container)
    const root = getByTestId('root')

    drag(root, [{ clientX: 30 }])

    expect(root.dataset.value).toBe('70')
  })
})

describe('XYPad', () => {
  test('reports both axes', () => {
    function Subject() {
      const [value, setValue] = useState<[number, number]>([0, 0])
      return (
        <XYPad.Root
          value={value}
          min={0}
          max={100}
          data-testid="root"
          data-value={value.join()}
          onChange={setValue}
        >
          <XYPad.Area>
            <XYPad.Thumb />
          </XYPad.Area>
        </XYPad.Root>
      )
    }

    const { getByTestId, container } = render(<Subject />)
    fakeLayout(container)
    const root = getByTestId('root')

    drag(root, [{ clientX: 20, clientY: 40 }])

    expect(root.dataset.value).toBe('20,40')
  })
})

describe('Knob', () => {
  test('raises the value as the pointer moves up, from where the drag started', () => {
    function Subject() {
      const [value, setValue] = useState(50)
      return (
        <Knob.Root
          value={value}
          min={0}
          max={100}
          data-testid="root"
          data-value={value}
          onChange={setValue}
        >
          <Knob.SVGRoot>
            <Knob.InactiveLine />
            <Knob.ActiveLine />
            <Knob.Thumb />
          </Knob.SVGRoot>
        </Knob.Root>
      )
    }

    const { getByTestId, container } = render(<Subject />)
    fakeLayout(container)
    const root = getByTestId('root')

    drag(root, [{ screenX: 0, screenY: 0 }, { screenY: -30 }])
    expect(root.dataset.value).toBe('80')

    // The origin of the drag is kept, so coming back returns to the start.
    act(() => {
      root.dispatchEvent(pointerEvent('pointermove', { screenY: 0 }))
    })
    expect(root.dataset.value).toBe('50')
  })
})
