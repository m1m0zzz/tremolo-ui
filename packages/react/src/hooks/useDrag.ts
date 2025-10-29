import { useRef, useCallback } from 'react'

import { useEventListener } from './useEventListener'
import { useRefCallbackEvent } from './useRefCallbackEvent'

interface UseDragProps {
  threshold?: number

  onDrag: (x: number, y: number, deltaX: number, deltaY: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

/**
 * @category hooks
 * @returns [refCallback, pointerDownHandler]
 */
export function useDrag<T extends Element>({
  threshold = 1,
  onDrag,
  onDragStart,
  onDragEnd,
}: UseDragProps): [
  (div: EventTarget | null) => void,
  (event: React.PointerEvent<T>) => void,
] {
  const dragOffsetX = useRef<number | undefined>(undefined)
  const dragOffsetY = useRef<number | undefined>(undefined)
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)

  const handleDrag = useCallback(
    (
      event: MouseEvent | React.MouseEvent<T, MouseEvent> | TouchEvent,
      first = false,
    ) => {
      const isTouch = event instanceof TouchEvent
      if (isTouch && event.cancelable) event.preventDefault()
      const screenX = isTouch ? event.touches[0].screenX : event.screenX
      const screenY = isTouch ? event.touches[0].screenY : event.screenY
      let deltaX = 0
      let deltaY = 0
      if (first) {
        dragStartX.current = screenX
        dragStartY.current = screenY
      }
      if (dragOffsetX.current) {
        deltaX = screenX - dragOffsetX.current
        dragOffsetX.current = screenX
      }
      if (dragOffsetY.current) {
        deltaY = screenY - dragOffsetY.current
        dragOffsetY.current = screenY
      }
      if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return
      onDrag(
        screenX - dragStartX.current,
        screenY - dragStartY.current,
        deltaX,
        deltaY,
      )
    },
    [threshold, onDrag],
  )

  const refHandler = useRefCallbackEvent(
    'touchmove',
    handleDrag,
    { passive: false },
    [onDrag],
  )

  const pointerDownHandler = useCallback(
    (event: React.PointerEvent<T>) => {
      dragOffsetX.current = event.screenX
      dragOffsetY.current = event.screenY
      handleDrag(event, true)
      onDragStart?.()
    },
    [handleDrag, onDragStart],
  )

  useEventListener(globalThis.window, 'mousemove', handleDrag)

  useEventListener(globalThis.window, 'pointerup', () => {
    dragOffsetX.current = undefined
    dragOffsetY.current = undefined
    onDragEnd?.()
  })

  return [refHandler, pointerDownHandler]
}
