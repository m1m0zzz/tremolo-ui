import { useCallback, useEffect, useRef } from 'react'

import { createLongPress, type LongPressInstance } from '@tremolo-ui/dom'

/**
 * Repeat `callback` while a pointer is held down: once on the press, then
 * every `interval` after `initialDelay`. The repeat itself is
 * `createLongPress` in `@tremolo-ui/dom`.
 *
 * Returns the function that starts a press, for an `onPointerDown`.
 */
export function useLongPress(
  callback: () => void,
  initialDelay = 500,
  interval = 40,
) {
  const callbackRef = useRef(callback)
  const instanceRef = useRef<LongPressInstance | null>(null)

  useEffect(() => {
    callbackRef.current = callback
    instanceRef.current?.update({ delay: initialDelay, interval })
  })

  useEffect(() => {
    const instance = createLongPress({
      onPress: () => callbackRef.current(),
      delay: initialDelay,
      interval,
    })
    instanceRef.current = instance
    return () => {
      instanceRef.current = null
      instance.destroy()
    }
    // Created once: the options are pushed with update() above, so that a new
    // delay does not end a press in progress.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useCallback(
    (event?: Pick<PointerEvent, 'button' | 'pointerId'>) =>
      instanceRef.current?.start(event),
    [],
  )
}
