import { DependencyList, useCallback, useInsertionEffect, useRef } from 'react'

/**
 * Internal
 * @private
 */
export function useCallbackRef<Args extends unknown[], Return>(
  callback: ((...args: Args) => Return) | undefined,
  deps: DependencyList = [],
) {
  const callbackRef = useRef<typeof callback>(() => {
    throw new Error('Cannot call an event handler while rendering.')
  })

  useInsertionEffect(() => {
    callbackRef.current = callback
  })

  // `deps` comes from the caller, so it cannot be the array literal the
  // compiler rules expect.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  return useCallback((...args: Args) => callbackRef.current?.(...args), deps)
}
