import { useCallback, useState } from 'react'

import { useEventListener } from './useEventListener'
import { useInterval } from './useInterval'

export function useLongPress(
  callback: () => void,
  initialDelay = 500,
  interval = 40,
) {
  const [pressed, setPressed] = useState(false)
  const [delay, setDelay] = useState(initialDelay)

  useInterval(
    () => {
      callback()
      setDelay(interval)
    },
    pressed ? delay : null,
  )

  useEventListener(globalThis.window, 'pointerup', () => {
    setPressed(false)
    setDelay(initialDelay)
  })

  return useCallback(() => {
    callback()
    setPressed(true)
  }, [callback])
}
