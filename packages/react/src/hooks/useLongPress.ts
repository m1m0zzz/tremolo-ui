import { useCallback, useRef, useState } from 'react'

import { useEventListener } from './useEventListener'
import { useInterval } from './useInterval'

export function useLongPress(
  callback: () => void,
  initialDelay = 500,
  interval = 40,
) {
  const [pressed, setPressed] = useState(false)
  const [delay, setDelay] = useState(initialDelay)
  const activePointerId = useRef<number | null>(null)
  const isPressed = useRef(false)

  useInterval(
    () => {
      callback()
      setDelay(interval)
    },
    pressed ? delay : null,
  )

  const stop = useCallback(
    (pointerId?: number) => {
      if (!isPressed.current) return
      if (
        pointerId !== undefined &&
        activePointerId.current !== null &&
        activePointerId.current !== pointerId
      )
        return

      isPressed.current = false
      activePointerId.current = null
      setPressed(false)
      setDelay(initialDelay)
    },
    [initialDelay],
  )

  useEventListener(globalThis.window, 'pointerup', (event) => {
    stop(event.pointerId)
  })

  useEventListener(globalThis.window, 'pointercancel', (event) => {
    stop(event.pointerId)
  })

  useEventListener(globalThis.window, 'blur', () => {
    stop()
  })

  return useCallback(
    (event?: Pick<PointerEvent, 'button' | 'pointerId'>) => {
      if (isPressed.current || (event && event.button !== 0)) return

      isPressed.current = true
      activePointerId.current = event?.pointerId ?? null
      callback()
      setPressed(true)
    },
    [callback],
  )
}
