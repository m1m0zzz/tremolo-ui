import { DependencyList, useCallback, useEffect, useRef } from 'react'

export function useAnimationFrame(
  callback = () => {},
  deps: DependencyList = [],
) {
  const reqIdRef = useRef(-1)
  const loop = useCallback(() => {
    reqIdRef.current = requestAnimationFrame(loop)
    callback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps])

  useEffect(() => {
    reqIdRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(reqIdRef.current)
  }, [loop])
}
