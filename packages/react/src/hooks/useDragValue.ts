import { RefObject, useEffect, useRef, useState } from 'react'

import {
  createDragValue,
  elementMapping,
  relativeMapping,
  type AxisOptions,
  type DragValueInstance,
  type XY,
  type XYInput,
} from '@tremolo-ui/dom'

import { useCallbackRef } from './_internal/useCallbackRef'

export interface UseDragValueOptions {
  /** Scaling of each axis; a single value applies to both. */
  axis: XYInput<AxisOptions>

  /**
   * Normalize the pointer against the bounding rect of this element, so that
   * the value *is* the position pointed at.
   *
   * Give either this or `getValue`.
   */
  baseElementRef?: RefObject<Element | null>

  /**
   * Move the value away from where it stood when the drag started, by the
   * distance dragged. The pointer position itself carries no meaning.
   *
   * Give either this or `baseElementRef`.
   */
  getValue?: () => XY<number>
  /**
   * Pixels of movement that span the whole range, with `getValue`.
   * @default 100
   */
  pixelRange?: XYInput<number>

  /** @see DragValueOptions.updateOnPointerDown */
  updateOnPointerDown?: boolean
  /** @default 0 */
  threshold?: number
  /** CSS cursor to show while dragging. Applied to the element itself. */
  cursor?: string

  onChange?: (value: XY<number>) => void
  onDragStart?: (value: XY<number>) => void
  onDragEnd?: (value: XY<number>) => void
}

/**
 * Drive a value with a pointer drag.
 *
 * @returns a ref callback for the element that starts the drag, and whether a drag is in progress
 */
export function useDragValue<T extends Element>(
  options: UseDragValueOptions,
): { refCallback: (node: T | null) => void; dragging: boolean } {
  const {
    axis,
    baseElementRef,
    pixelRange,
    updateOnPointerDown,
    threshold,
    cursor,
  } = options

  if (!baseElementRef && !options.getValue) {
    throw new Error(
      'useDragValue: give either baseElementRef or getValue, so that the drag has something to move',
    )
  }

  const [dragging, setDragging] = useState(false)

  const valueGetter = useCallbackRef(options.getValue)
  const changeHandler = useCallbackRef(options.onChange)
  const dragStartHandler = useCallbackRef(options.onDragStart)
  const dragEndHandler = useCallbackRef(options.onDragEnd)

  // Read when the instance is created. The effect below keeps it current, and
  // runs right after, so a stale setting is replaced within the same commit.
  const latest = useRef(options)

  const instanceRef = useRef<DragValueInstance | null>(null)

  // See useDrag for why the node is held in state.
  const [node, setNode] = useState<T | null>(null)

  const [pixelRangeX, pixelRangeY] = Array.isArray(pixelRange)
    ? pixelRange
    : [pixelRange, pixelRange]

  useEffect(() => {
    if (!node) return

    const instance = createDragValue(node, {
      axis: latest.current.axis,
      mapping: baseElementRef
        ? elementMapping(() => baseElementRef.current)
        : relativeMapping({
            pixelRange: [pixelRangeX ?? 100, pixelRangeY ?? 100],
          }),
      getValue: () => valueGetter() ?? [0, 0],
      updateOnPointerDown: latest.current.updateOnPointerDown,
      threshold: latest.current.threshold,
      cursor: latest.current.cursor,
      onChange: (value) => changeHandler(value),
      onDragStart: (value) => {
        setDragging(true)
        dragStartHandler(value)
      },
      onDragEnd: (value) => {
        setDragging(false)
        dragEndHandler(value)
      },
    })
    instanceRef.current = instance

    return () => {
      instanceRef.current = null
      instance.destroy()
    }
  }, [
    node,
    baseElementRef,
    pixelRangeX,
    pixelRangeY,
    valueGetter,
    changeHandler,
    dragStartHandler,
    dragEndHandler,
  ])

  // Runs after every render: the settings come from props and are cheap to
  // push, and updating in place leaves a drag in progress untouched.
  useEffect(() => {
    latest.current = options
    instanceRef.current?.update({
      axis,
      updateOnPointerDown,
      threshold,
      cursor,
    })
  })

  return { refCallback: setNode, dragging }
}
