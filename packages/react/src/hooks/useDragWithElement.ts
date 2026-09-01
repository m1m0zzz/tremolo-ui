import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { createDrag } from '@tremolo-ui/dom'
import { normalizeValue } from '@tremolo-ui/functions'

import { useCallbackRef } from './useCallbackRef'

interface UseDragWithElement<T extends Element> {
  baseElementRef: RefObject<T | null>
  /**
   * Report the position on pointer down, before any movement.
   *
   * Enable it where the pointer position *is* the value, so that a plain click
   * jumps to it. Leave it off where the element being dragged is an object in
   * its own right, so that grabbing its edge does not shift it under the cursor.
   *
   * @default false
   */
  updateOnPointerDown?: boolean
  /** CSS cursor to show while dragging. Applied to the element itself. */
  cursor?: string
  onDrag: (normalizedX: number, normalizedY: number) => void
  onDragStart?: (normalizedX: number, normalizedY: number) => void
  onDragEnd?: (normalizedX: number, normalizedY: number) => void
}

/**
 * Track a pointer drag, reporting the position normalized against
 * the bounding rect of `baseElementRef`.
 *
 * @returns a ref callback for the element that starts the drag, and whether a drag is in progress
 */
export function useDragWithElement<T extends Element>({
  baseElementRef,
  updateOnPointerDown = false,
  cursor,
  onDrag,
  onDragStart,
  onDragEnd,
}: UseDragWithElement<T>) {
  const [dragging, setDragging] = useState(false)
  const normalizedX = useRef(0)
  const normalizedY = useRef(0)

  const dragHandler = useCallbackRef(onDrag)
  const dragStartHandler = useCallbackRef(onDragStart)
  const dragEndHandler = useCallbackRef(onDragEnd)

  const update = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseElementRef.current
      if (!base) return false
      const { left, top, right, bottom } = base.getBoundingClientRect()
      normalizedX.current = normalizeValue(clientX, left, right)
      normalizedY.current = normalizeValue(clientY, top, bottom)
      return true
    },
    [baseElementRef],
  )

  // See useDrag for why the node is held in state.
  const [node, setNode] = useState<Element | null>(null)

  useEffect(() => {
    if (!node) return

    const instance = createDrag(node, {
      cursor,
      onDragStart: ({ clientX, clientY }) => {
        setDragging(true)
        const updated = update(clientX, clientY)
        if (updated && updateOnPointerDown) {
          dragHandler(normalizedX.current, normalizedY.current)
        }
        dragStartHandler(normalizedX.current, normalizedY.current)
      },
      onDrag: ({ clientX, clientY }) => {
        if (update(clientX, clientY)) {
          dragHandler(normalizedX.current, normalizedY.current)
        }
      },
      onDragEnd: () => {
        setDragging(false)
        dragEndHandler(normalizedX.current, normalizedY.current)
      },
    })

    return () => instance.destroy()
  }, [
    node,
    update,
    updateOnPointerDown,
    cursor,
    dragHandler,
    dragStartHandler,
    dragEndHandler,
  ])

  return { refCallback: setNode, dragging }
}
