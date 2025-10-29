import { useRef, useCallback, RefObject } from 'react'

import { normalizeValue } from '@tremolo-ui/functions'

import { useEventListener } from './useEventListener'
import { useRefCallbackEvent } from './useRefCallbackEvent'

interface UseDragWithElementProps<T extends Element> {
  baseElementRef: RefObject<T | null>
  onDrag: (normalizedX: number, normalizedY: number) => void
  onDragStart?: (normalizedX: number, normalizedY: number) => void
  onDragEnd?: (normalizedX: number, normalizedY: number) => void
}

/**
 * @category hooks
 * @returns [refCallback, pointerDownHandler]
 */
export function useDragWithElement<T extends Element>({
  baseElementRef,
  onDrag,
  onDragStart,
  onDragEnd,
}: UseDragWithElementProps<T>): [
  (div: EventTarget | null) => void,
  (event: React.PointerEvent<T>) => void,
] {
  const dragged = useRef(false)
  const normalizedX = useRef(0)
  const normalizedY = useRef(0)

  const handleDrag = useCallback(
    (event: MouseEvent | React.PointerEvent<T> | TouchEvent) => {
      if (!baseElementRef.current || !dragged.current) {
        return
      }
      const isTouch = event instanceof TouchEvent
      if (isTouch && event.cancelable) event.preventDefault()
      const { left, top, right, bottom } =
        baseElementRef.current.getBoundingClientRect()
      const mouseX = isTouch ? event.touches[0].clientX : event.clientX
      const mouseY = isTouch ? event.touches[0].clientY : event.clientY
      const nx = normalizeValue(mouseX, left, right)
      const ny = normalizeValue(mouseY, top, bottom)
      normalizedX.current = nx
      normalizedY.current = ny
      onDrag(nx, ny)
    },
    [onDrag, baseElementRef],
  )

  const refHandler = useRefCallbackEvent(
    'touchmove',
    handleDrag,
    { passive: false },
    [onDrag],
  )

  const pointerDownHandler = useCallback(
    (event: React.PointerEvent<T>) => {
      dragged.current = true
      handleDrag(event)
      onDragStart?.(normalizedX.current, normalizedY.current)
    },
    [handleDrag, onDragStart],
  )

  useEventListener(globalThis.window, 'pointermove', handleDrag)

  useEventListener(globalThis.window, 'pointerup', () => {
    if (!dragged.current) return
    dragged.current = false
    onDragEnd?.(normalizedX.current, normalizedY.current)
  })

  return [refHandler, pointerDownHandler]
}
