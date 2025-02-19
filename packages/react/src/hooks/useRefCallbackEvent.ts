import { useMemo } from 'react'

type Options = boolean | AddEventListenerOptions
type CallbackFunc = (div: EventTarget | null) => void

export function useRefCallbackEvent<K extends keyof DocumentEventMap>(
  event: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: Options,
  deps?: React.DependencyList,
): CallbackFunc
export function useRefCallbackEvent(
  event: string,
  handler: (event: Event) => void,
  options?: Options,
  deps: React.DependencyList = [],
): CallbackFunc {
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
