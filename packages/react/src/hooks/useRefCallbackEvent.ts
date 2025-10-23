import { useMemo } from 'react'

/**
 * Internal
 */
export function useRefCallbackEvent<K extends keyof DocumentEventMap>(
  event: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
  deps?: React.DependencyList,
): (div: EventTarget | null) => void
export function useRefCallbackEvent(
  event: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions,
  deps: React.DependencyList = [],
): (div: EventTarget | null) => void {
  return useMemo(() => {
    let cleanup: (() => void) | undefined
    return (node: EventTarget | null) => {
      if (!node) {
        cleanup?.()
        return
      }
      node.addEventListener(event, handler, options)

      cleanup = () => {
        node.removeEventListener(event, handler, options)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
