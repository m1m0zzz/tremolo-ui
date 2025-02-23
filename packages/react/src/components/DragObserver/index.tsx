import { ComponentPropsWithoutRef, ElementType, ReactNode, useRef } from 'react'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'

/** @category DragObserver */
export interface DragObserverProps<T extends ElementType> {
  /**
   * React.ElementType
   * @default div
   */
  as?: T

  /**
   * Threshold at which the onDrag event fires.
   * Prevents onDrag events from firing, for example, when double-clicking.
   */
  threshold?: number

  children?: ReactNode
  onDrag: (x: number, y: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

/** @category DragObserver */
export function DragObserver<T extends ElementType = 'div'>(
  props: DragObserverProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof DragObserverProps<T>>,
) {
  const {
    children,
    onDrag,
    onDragStart,
    onDragEnd,
    as: Component = 'div',
    ...attributes
  } = props

  const dragOffsetX = useRef<number | undefined>(undefined)
  const dragOffsetY = useRef<number | undefined>(undefined)

  const handleEvent = (
    event:
      | MouseEvent
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | TouchEvent,
  ) => {
    const isTouch = event instanceof TouchEvent
    if (isTouch && event.cancelable) event.preventDefault()
    const screenX = isTouch ? event.touches[0].screenX : event.screenX
    const screenY = isTouch ? event.touches[0].screenY : event.screenY
    let deltaX = 0,
      deltaY = 0
    if (dragOffsetX.current) {
      deltaX = screenX - dragOffsetX.current
      dragOffsetX.current = screenX
    }
    if (dragOffsetY.current) {
      deltaY = screenY - dragOffsetY.current
      dragOffsetY.current = screenY
    }
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return
    if (onDrag) onDrag(deltaX, deltaY)
  }

  const touchMoveRefCallback = useRefCallbackEvent(
    'touchmove',
    handleEvent,
    { passive: false },
    [onDrag],
  )

  useEventListener(window, 'mousemove', handleEvent)

  useEventListener(window, 'pointerup', () => {
    dragOffsetX.current = undefined
    dragOffsetY.current = undefined
    onDragEnd?.()
  })

  return (
    <Component
      ref={touchMoveRefCallback}
      onPointerDown={(event) => {
        dragOffsetX.current = event.screenX
        dragOffsetY.current = event.screenY
        handleEvent(event)
        onDragStart?.()
      }}
      {...attributes}
    >
      {children}
    </Component>
  )
}
