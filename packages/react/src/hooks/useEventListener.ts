import { useCallback, useEffect, useRef } from 'react'

import { useCallbackRef } from './_internal/useCallbackRef'

type Target = EventTarget | null | (() => EventTarget | null)
type Options = boolean | AddEventListenerOptions

export function useEventListener<K extends keyof DocumentEventMap>(
  target: Target,
  event: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: Options,
): VoidFunction
export function useEventListener<K extends keyof WindowEventMap>(
  target: Target,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: Options,
): VoidFunction
export function useEventListener<K extends keyof GlobalEventHandlersEventMap>(
  target: Target,
  event: K,
  handler: (event: GlobalEventHandlersEventMap[K]) => void,
  options?: Options,
): VoidFunction
export function useEventListener(
  target: Target,
  event: string,
  handler: (event: Event) => void,
  options?: Options,
) {
  const listener = useCallbackRef(handler)
  const cleanupRef = useRef<VoidFunction>(() => {})

  useEffect(() => {
    const node = typeof target === 'function' ? target() : (target ?? document)

    if (!node) return

    node.addEventListener(event, listener, options)
    const cleanup = () => {
      node.removeEventListener(event, listener, options)
    }
    cleanupRef.current = cleanup

    return () => {
      cleanup()
      if (cleanupRef.current === cleanup) cleanupRef.current = () => {}
    }
  }, [event, target, options, listener])

  return useCallback(() => cleanupRef.current(), [])
}
