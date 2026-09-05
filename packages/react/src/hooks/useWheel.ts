import { RefObject, useEffect, useState } from 'react'

import { createWheel, type WheelOptions } from '@tremolo-ui/dom'

import { useCallbackRef } from './_internal/useCallbackRef'

export interface UseWheelOptions extends WheelOptions {
  /**
   * Listen on this element rather than on the one the returned ref callback is
   * attached to, and ignore that callback.
   *
   * For a control made of several movable parts: a wheel event only reaches
   * what the cursor is over, so a listener per part responds only while the
   * cursor is over that same part. Listening on the element they share lets
   * every part see the event, and each one decide whether it is the one to act.
   *
   * The element is read when the listener is attached, so a ref filled in by a
   * parent is fine as long as the parent is above in the tree.
   */
  target?: RefObject<Element | null>
}

/**
 * Listen to wheel events on an element.
 *
 * The listener is not passive, so the handler may call `preventDefault()`.
 *
 * @returns a ref callback to attach to the element, unused when `target` is given
 */
export function useWheel<T extends Element>(
  onWheel: (event: WheelEvent) => void,
  { requireFocus = false, target }: UseWheelOptions = {},
): (node: T | null) => void {
  const wheelHandler = useCallbackRef(onWheel)

  // See useDrag for why the node is held in state.
  const [node, setNode] = useState<T | null>(null)

  useEffect(() => {
    const element = target ? target.current : node
    if (!element) return

    const instance = createWheel(element, (event) => wheelHandler(event), {
      requireFocus,
    })

    return () => instance.destroy()
  }, [node, target, wheelHandler, requireFocus])

  return setNode
}
