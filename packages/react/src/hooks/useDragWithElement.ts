import { RefObject, useCallback, useRef, useState } from 'react'

import { createDrag, type DragInstance } from '@tremolo-ui/dom'
import { normalizeValue } from '@tremolo-ui/functions'

import { useCallbackRef } from './useCallbackRef'

interface UseDragWithElement<T extends Element> {
  baseElementRef: RefObject<T | null>
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

  const instance = useRef<DragInstance | null>(null)

  const refCallback = useCallback(
    (node: Element | null) => {
      instance.current?.destroy()
      instance.current = null
      if (!node) return

      instance.current = createDrag(node, {
        onDragStart: ({ clientX, clientY }) => {
          setDragging(true)
          // The position is recorded but onDrag is not called: a pointer down
          // on its own does not move the value, only a drag does.
          update(clientX, clientY)
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
    },
    [update, dragHandler, dragStartHandler, dragEndHandler],
  )

  return { refCallback, dragging }
}
