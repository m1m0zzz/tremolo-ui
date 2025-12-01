import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { useDrag } from '../../hooks/useDrag'
import { Override } from '../_util/type'

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
  onDrag?: (x: number, y: number, deltaX: number, deltaY: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

/** @category DragObserver */
export function DragObserver<T extends ElementType = 'div'>(
  props: Override<DragObserverProps<T>, ComponentPropsWithoutRef<T>>,
) {
  const {
    as: Component = 'div',
    threshold = 1,
    onDrag,
    onDragStart,
    onDragEnd,
    children,
    onPointerDown,
    ...attributes
  } = props

  const [refCallback, pointerDownHandler] = useDrag({
    threshold: threshold,
    onDrag: onDrag,
    onDragStart: onDragStart,
    onDragEnd: onDragEnd,
  })

  return (
    <Component
      ref={refCallback}
      onPointerDown={(e) => {
        pointerDownHandler(e)
        onPointerDown?.(e)
      }}
      {...attributes}
    >
      {children}
    </Component>
  )
}
