import { DependencyList, useEffect, useRef } from 'react'

export function useAnimationFrame(
  callback = () => {},
  deps: DependencyList = [],
) {
  const reqIdRef = useRef(-1)

  useEffect(() => {
    // Kept inside the effect: as a `useCallback` the loop would have to
    // reference itself before it is declared, which the compiler rules reject.
    const loop = () => {
      reqIdRef.current = requestAnimationFrame(loop)
      callback()
    }

    reqIdRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(reqIdRef.current)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps])
}
