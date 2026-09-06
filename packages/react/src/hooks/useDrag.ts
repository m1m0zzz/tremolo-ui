import { useEffect, useState } from 'react'

import { createDrag, type DragState } from '@tremolo-ui/dom'

import { useCallbackRef } from './_internal/useCallbackRef'

interface UseDragProps {
  /**
   * Threshold at which the onDrag event fires.
   * Prevents onDrag events from firing, for example, when double-clicking.
   */
  threshold?: number

  /** CSS cursor to show while dragging. Applied to the element itself. */
  cursor?: string

  /**
   * @param state the whole drag, for anything the four numbers leave out —
   * the pointer event and its modifier keys, most of all.
   */
  onDrag?: (
    x: number,
    y: number,
    deltaX: number,
    deltaY: number,
    state: DragState,
  ) => void
  onDragStart?: (state: DragState) => void
  onDragEnd?: (state: DragState) => void
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
      onDragStart: (state) => dragStartHandler(state),
      onDrag: (state) =>
        dragHandler(state.x, state.y, state.deltaX, state.deltaY, state),
      onDragEnd: (state) => dragEndHandler(state),
    })

    return () => instance.destroy()
  }, [node, threshold, cursor, dragHandler, dragStartHandler, dragEndHandler])

  return setNode
}
