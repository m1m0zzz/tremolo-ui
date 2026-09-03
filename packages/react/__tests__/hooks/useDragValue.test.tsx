import { act, render } from '@testing-library/react'
import { useRef, useState } from 'react'

import { useDragValue } from '../../src/hooks/useDragValue'

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

function withPointerCapture(element: Element) {
  const captured = new Set<number>()
  Object.assign(element, {
    setPointerCapture: (id: number) => captured.add(id),
    releasePointerCapture: (id: number) => captured.delete(id),
    hasPointerCapture: (id: number) => captured.has(id),
  })
}

/** jsdom lays nothing out, so the track is given a rect of its own. */
function withRect(element: Element) {
  element.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    }) as DOMRect
}

/**
 * A slider-shaped subject: the value lives in state, as it does in the
 * components, and the ref is attached with an inline callback.
 */
function Absolute({
  max = 100,
  onChange,
}: {
  max?: number
  onChange?: (value: number) => void
}) {
  const [value, setValue] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const { refCallback, dragging } = useDragValue<HTMLDivElement>({
    axis: { min: 0, max },
    baseElementRef: trackRef,
    updateOnPointerDown: true,
    onChange: ([x]) => {
      setValue(x)
      onChange?.(x)
    },
  })

  return (
    <div
      data-testid="root"
      data-value={value}
      data-dragging={dragging}
      ref={(node) => {
        if (node) withPointerCapture(node)
        refCallback(node)
      }}
    >
      <div
        data-testid="track"
        ref={(node) => {
          if (node) withRect(node)
          trackRef.current = node
        }}
      />
    </div>
  )
}

/** A knob-shaped subject: the value moves relative to where the drag started. */
function Relative() {
  const [value, setValue] = useState(50)

  const { refCallback } = useDragValue<HTMLDivElement>({
    axis: [
      { min: 0, max: 100 },
      { min: 0, max: 100, reverse: true },
    ],
    getValue: () => [value, value],
    onChange: ([, y]) => setValue(y),
  })

  return (
    <div
      data-testid="root"
      data-value={value}
      ref={(node) => {
        if (node) withPointerCapture(node)
        refCallback(node)
      }}
    />
  )
}

describe('useDragValue', () => {
  test('reports the value under the pointer, from pointer down onwards', () => {
    const { getByTestId } = render(<Absolute />)
    const root = getByTestId('root')

    act(() => {
      root.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 20, clientY: 0 }),
      )
    })
    expect(root.dataset.value).toBe('20')
    expect(root.dataset.dragging).toBe('true')

    act(() => {
      root.dispatchEvent(
        pointerEvent('pointermove', { clientX: 70, screenX: 50 }),
      )
    })
    expect(root.dataset.value).toBe('70')

    act(() => {
      root.dispatchEvent(pointerEvent('pointerup', { screenX: 50 }))
    })
    expect(root.dataset.dragging).toBe('false')
  })

  test('keeps tracking across the re-renders each new value causes', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(<Absolute onChange={onChange} />)
    const root = getByTestId('root')

    act(() => {
      root.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
      )
    })
    for (const clientX of [10, 20, 30]) {
      act(() => {
        root.dispatchEvent(
          pointerEvent('pointermove', { clientX, screenX: clientX }),
        )
      })
    }

    expect(onChange.mock.calls.map(([v]) => v)).toEqual([0, 10, 20, 30])
  })

  test('picks up a changed setting without interrupting the drag', () => {
    const { getByTestId, rerender } = render(<Absolute max={100} />)
    const root = getByTestId('root')

    act(() => {
      root.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 50, clientY: 0 }),
      )
    })
    expect(root.dataset.value).toBe('50')

    rerender(<Absolute max={10} />)
    act(() => {
      root.dispatchEvent(
        pointerEvent('pointermove', { clientX: 50, screenX: 10 }),
      )
    })

    expect(root.dataset.value).toBe('5')
  })

  test('moves the value relative to the start of the drag', () => {
    const { getByTestId } = render(<Relative />)
    const root = getByTestId('root')

    act(() => {
      root.dispatchEvent(
        pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
      )
    })
    act(() => {
      root.dispatchEvent(pointerEvent('pointermove', { screenY: -20 }))
    })

    expect(root.dataset.value).toBe('70')
  })
})
