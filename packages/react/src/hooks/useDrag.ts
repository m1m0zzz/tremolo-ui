import { useEffect, useState } from 'react'

import { createDrag, type DragState } from '@tremolo-ui/dom'

import { useCallbackRef } from './_internal/useCallbackRef'

export interface UseDragOptions {
  /**
   * Pixels the pointer has to travel before the drag counts as one.
   *
   * A click moves the pointer by a pixel or two, so without a threshold a
   * double click reports a drag between the two presses.
   *
   * @default 1
   */
  threshold?: number

  /** CSS cursor to show while dragging. Applied to the element itself. */
  cursor?: string

  /**
   * Hide the pointer and read its movement directly, instead of following it
   * around the screen.
   *
   * @see DragOptions.pointerLock
   * @default false
   */
  pointerLock?: boolean

  /**
   * Called on every move once the drag has started, with the pointer position
   * relative to the element and how far it moved since the last call.
   *
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
  /** Called once the pointer has moved past `threshold`, not on pointerdown. */
  onDragStart?: (state: DragState) => void
  /** Called when the pointer is released, only if the drag ever started. */
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
  pointerLock,
  onDrag,
  onDragStart,
  onDragEnd,
}: UseDragOptions): (node: T | null) => void {
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
      pointerLock,
      onDragStart: (state) => dragStartHandler(state),
      onDrag: (state) =>
        dragHandler(state.x, state.y, state.deltaX, state.deltaY, state),
      onDragEnd: (state) => dragEndHandler(state),
    })

    return () => instance.destroy()
  }, [
    node,
    threshold,
    cursor,
    pointerLock,
    dragHandler,
    dragStartHandler,
    dragEndHandler,
  ])

  return setNode
}
