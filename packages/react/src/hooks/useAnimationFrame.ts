import { useEffect } from 'react'

import { useCallbackRef } from './_internal/useCallbackRef'

export interface UseAnimationFrameOptions {
  /**
   * Stop the loop. Turning it back on starts a new one, whose first frame has
   * a `deltaTime` of `0`.
   * @default false
   */
  disabled?: boolean
}

/**
 * Call `callback` on every animation frame for as long as the component is
 * mounted.
 *
 * The callback is read on every frame, so it can be written inline and see
 * the latest render without restarting the loop.
 *
 * @param callback receives the frame's timestamp and the milliseconds since
 * the previous frame, which is `0` on the first one
 */
export function useAnimationFrame(
  callback: (timestamp: DOMHighResTimeStamp, deltaTime: number) => void,
  { disabled = false }: UseAnimationFrameOptions = {},
) {
  // Read through a ref rather than depended on: `useAnimationFrame(() => ...)`
  // is a new function on every render, and a callback that renders would then
  // cancel and re-schedule its own loop on every frame.
  const runCallback = useCallbackRef(callback)

  useEffect(() => {
    if (disabled) return

    let frameId = 0
    let previous: DOMHighResTimeStamp | undefined

    // Scheduled before calling back, so that a slow callback does not delay
    // the next request.
    const loop = (timestamp: DOMHighResTimeStamp) => {
      frameId = requestAnimationFrame(loop)
      runCallback(timestamp, previous === undefined ? 0 : timestamp - previous)
      previous = timestamp
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [runCallback, disabled])
}
