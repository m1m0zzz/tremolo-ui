import { RefObject, useEffect, useRef, useState } from 'react'

import {
  createDragValue,
  elementMapping,
  relativeMapping,
  type AxisOptions,
  type DragState,
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
  /**
   * How much the movement counts, read on every move. `0.1` makes the same
   * movement cover a tenth of the range, which is what a fine-adjustment
   * modifier wants.
   *
   * With `baseElementRef` the value is normally the position pointed at, so
   * anything but `1` turns the mapping relative and leaves the pointer and the
   * value apart for the rest of the drag.
   *
   * @see relativeMapping
   * @see elementMapping
   */
  sensitivity?: (state: DragState) => number

  /** @see DragValueOptions.updateOnPointerDown */
  updateOnPointerDown?: boolean
  /** @default 0 */
  threshold?: number
  /** CSS cursor to show while dragging. Applied to the element itself. */
  cursor?: string
  /**
   * Hide the pointer and read its movement directly, instead of following it
   * around the screen. Only with `getValue`: there is no pointer position to
   * normalize against a `baseElementRef` while the pointer is locked.
   *
   * @see DragOptions.pointerLock
   * @default false
   */
  pointerLock?: boolean
  /**
   * Decide whether a pointerdown starts a drag at all, before the pointer is
   * captured.
   *
   * @see DragOptions.shouldStart
   */
  shouldStart?: (event: PointerEvent) => boolean

  /**
   * @param state the whole drag, for anything the value leaves out — the
   * pointer event and its modifier keys, most of all.
   */
  onChange?: (value: XY<number>, state: DragState) => void
  onDragStart?: (value: XY<number>, state: DragState) => void
  onDragEnd?: (value: XY<number>, state: DragState) => void
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
    pointerLock,
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
        ? elementMapping(() => baseElementRef.current, {
            // Read through the ref so that a changed setting reaches a drag
            // already in progress.
            sensitivity: (state) => latest.current.sensitivity?.(state) ?? 1,
          })
        : relativeMapping({
            pixelRange: [pixelRangeX ?? 100, pixelRangeY ?? 100],
            // Read through the ref so that a changed setting reaches a drag
            // already in progress.
            sensitivity: (state) => latest.current.sensitivity?.(state) ?? 1,
          }),
      getValue: () => valueGetter() ?? [0, 0],
      updateOnPointerDown: latest.current.updateOnPointerDown,
      threshold: latest.current.threshold,
      cursor: latest.current.cursor,
      pointerLock: latest.current.pointerLock,
      shouldStart: (event) => latest.current.shouldStart?.(event) ?? true,
      onChange: (value, state) => changeHandler(value, state),
      onDragStart: (value, state) => {
        setDragging(true)
        dragStartHandler(value, state)
      },
      onDragEnd: (value, state) => {
        setDragging(false)
        dragEndHandler(value, state)
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
      pointerLock,
    })
  })

  return { refCallback: setNode, dragging }
}
