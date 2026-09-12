import { DependencyList, useEffect, useRef } from 'react'

import { useCallbackRef } from './_internal/useCallbackRef'

export function useAnimationFrame(
  callback = () => {},
  deps: DependencyList = [],
) {
  const reqIdRef = useRef(-1)
  // Read through a ref rather than depended on: `useAnimationFrame(() => ...)`
  // is a new function on every render, and a callback that renders would then
  // cancel and re-schedule its own loop on every frame. What restarts the loop
  // is the caller's `deps`, and nothing else.
  const runCallback = useCallbackRef(callback)

  useEffect(() => {
    // Kept inside the effect: as a `useCallback` the loop would have to
    // reference itself before it is declared, which the compiler rules reject.
    const loop = () => {
      reqIdRef.current = requestAnimationFrame(loop)
      runCallback()
    }

    reqIdRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(reqIdRef.current)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [runCallback, ...deps])
}
