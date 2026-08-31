import { useEffect, useState } from 'react'

import { createWheel } from '@tremolo-ui/dom'

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

  // See useDrag for why the node is held in state.
  const [node, setNode] = useState<T | null>(null)

  useEffect(() => {
    if (!node) return

    const instance = createWheel(node, (event) => wheelHandler(event))

    return () => instance.destroy()
  }, [node, wheelHandler])

  return setNode
}
