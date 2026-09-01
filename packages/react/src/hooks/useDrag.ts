import { useEffect, useState } from 'react'

import { createDrag } from '@tremolo-ui/dom'

import { useCallbackRef } from './useCallbackRef'

interface UseDragProps {
  /**
   * Threshold at which the onDrag event fires.
   * Prevents onDrag events from firing, for example, when double-clicking.
   */
  threshold?: number

  /** CSS cursor to show while dragging. Applied to the element itself. */
  cursor?: string

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
  cursor,
  onDrag,
  onDragStart,
  onDragEnd,
}: UseDragProps): (node: T | null) => void {
  const dragHandler = useCallbackRef(onDrag)
  const dragStartHandler = useCallbackRef(onDragStart)
  const dragEndHandler = useCallbackRef(onDragEnd)

  // The node is held in state rather than bound in the ref callback itself, so
  // that re-attaching the ref with the same node does not restart the drag.
  // React re-attaches on every render when the caller passes an inline ref.
  const [node, setNode] = useState<T | null>(null)

  useEffect(() => {
    if (!node) return

    const instance = createDrag(node, {
      threshold,
      cursor,
      onDragStart: () => dragStartHandler(),
      onDrag: ({ x, y, deltaX, deltaY }) => dragHandler(x, y, deltaX, deltaY),
      onDragEnd: () => dragEndHandler(),
    })

    return () => instance.destroy()
  }, [node, threshold, cursor, dragHandler, dragStartHandler, dragEndHandler])

  return setNode
}
