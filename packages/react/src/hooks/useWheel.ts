import { useEffect, useState } from 'react'

import { createWheel, type WheelOptions } from '@tremolo-ui/dom'

import { useCallbackRef } from './_internal/useCallbackRef'

/**
 * Listen to wheel events on an element.
 *
 * The listener is not passive, so the handler may call `preventDefault()`.
 *
 * @returns a ref callback to attach to the element
 */
export function useWheel<T extends Element>(
  onWheel: (event: WheelEvent) => void,
  { requireFocus = false }: WheelOptions = {},
): (node: T | null) => void {
  const wheelHandler = useCallbackRef(onWheel)

  // See useDrag for why the node is held in state.
  const [node, setNode] = useState<T | null>(null)

  useEffect(() => {
    if (!node) return

    const instance = createWheel(node, (event) => wheelHandler(event), {
      requireFocus,
    })

    return () => instance.destroy()
  }, [node, wheelHandler, requireFocus])

  return setNode
}
