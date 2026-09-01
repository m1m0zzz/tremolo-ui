import { act, render } from '@testing-library/react'
import { useState } from 'react'

import { useDrag } from '../../src/hooks/useDrag'

// jsdom has no PointerEvent and no pointer capture, so both are faked here.
function pointerEvent(
  type: string,
  init: { screenX?: number; screenY?: number } = {},
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

/**
 * Mirrors how the components attach the ref: an inline callback, which React
 * re-creates on every render and therefore detaches and re-attaches. A state
 * update on drag start makes that happen in the middle of a drag.
 */
function Subject({ onDrag }: { onDrag: (x: number, y: number) => void }) {
  const [dragging, setDragging] = useState(false)
  const dragRef = useDrag<HTMLDivElement>({
    onDrag: (x, y) => onDrag(x, y),
    onDragStart: () => setDragging(true),
    onDragEnd: () => setDragging(false),
  })

  return (
    <div
      data-testid="target"
      data-dragging={dragging}
      ref={(node) => {
        if (node) withPointerCapture(node)
        dragRef(node)
      }}
    />
  )
}

describe('useDrag', () => {
  test('keeps tracking across re-renders caused by an inline ref callback', () => {
    const onDrag = jest.fn()
    const { getByTestId } = render(<Subject onDrag={onDrag} />)
    const target = getByTestId('target')

    act(() => {
      target.dispatchEvent(
        pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
      )
    })
    expect(target.dataset.dragging).toBe('true')

    act(() => {
      target.dispatchEvent(
        pointerEvent('pointermove', { screenX: 10, screenY: 5 }),
      )
    })

    expect(onDrag).toHaveBeenCalledTimes(1)
    expect(onDrag).toHaveBeenCalledWith(10, 5)
  })

  test('stops tracking when the element unmounts', () => {
    const onDrag = jest.fn()
    const { getByTestId, unmount } = render(<Subject onDrag={onDrag} />)
    const target = getByTestId('target')

    act(() => {
      target.dispatchEvent(
        pointerEvent('pointerdown', { screenX: 0, screenY: 0 }),
      )
    })
    unmount()
    act(() => {
      target.dispatchEvent(
        pointerEvent('pointermove', { screenX: 10, screenY: 5 }),
      )
    })

    expect(onDrag).not.toHaveBeenCalled()
  })
})
