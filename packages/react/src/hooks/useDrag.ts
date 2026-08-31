import { useCallback, useRef } from 'react'

import { createDrag, type DragInstance } from '@tremolo-ui/dom'

import { useCallbackRef } from './useCallbackRef'

interface UseDragProps {
  /**
   * Threshold at which the onDrag event fires.
   * Prevents onDrag events from firing, for example, when double-clicking.
   */
  threshold?: number

  onDrag?: (x: number, y: number, deltaX: number, deltaY: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

/**
 * Track a pointer drag on an element.
 *
 * @returns a ref callback to attach to the element being dragged
 */
export function useDrag<T extends Element>({
  threshold = 1,
  onDrag,
  onDragStart,
  onDragEnd,
}: UseDragProps): (node: T | null) => void {
  const dragHandler = useCallbackRef(onDrag)
  const dragStartHandler = useCallbackRef(onDragStart)
  const dragEndHandler = useCallbackRef(onDragEnd)

  const instance = useRef<DragInstance | null>(null)

  return useCallback(
    (node: T | null) => {
      instance.current?.destroy()
      instance.current = null
      if (!node) return

      instance.current = createDrag(node, {
        threshold,
        onDragStart: () => dragStartHandler(),
        onDrag: ({ x, y, deltaX, deltaY }) => dragHandler(x, y, deltaX, deltaY),
        onDragEnd: () => dragEndHandler(),
      })
    },
    [threshold, dragHandler, dragStartHandler, dragEndHandler],
  )
}
