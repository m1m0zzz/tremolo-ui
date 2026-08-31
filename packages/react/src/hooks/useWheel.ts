import { useCallback, useRef } from 'react'

import { createWheel, type WheelInstance } from '@tremolo-ui/dom'

import { useCallbackRef } from './useCallbackRef'

/**
 * Listen to wheel events on an element.
 *
 * The listener is not passive, so the handler may call `preventDefault()`.
 *
 * @returns a ref callback to attach to the element
 */
export function useWheel<T extends Element>(
  onWheel: (event: WheelEvent) => void,
): (node: T | null) => void {
  const wheelHandler = useCallbackRef(onWheel)
  const instance = useRef<WheelInstance | null>(null)

  return useCallback(
    (node: T | null) => {
      instance.current?.destroy()
      instance.current = null
      if (!node) return

      instance.current = createWheel(node, (event) => wheelHandler(event))
    },
    [wheelHandler],
  )
}
