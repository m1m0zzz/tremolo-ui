import { createWheel, replaceOptions, type WheelOptions } from '@tremolo-ui/dom'

import type { Action } from 'svelte/action'

export interface WheelActionOptions extends WheelOptions {
  onWheel: (event: WheelEvent) => void
}

/**
 * Listen to the wheel on the element, as a non-passive listener so that
 * `preventDefault()` can keep the page from scrolling. See `createWheel` in
 * `@tremolo-ui/dom`.
 *
 * @example
 * <div use:wheel={{ onWheel: (e) => { e.preventDefault(); … }, requireFocus: true }}></div>
 */
export const wheel: Action<Element, WheelActionOptions> = (node, options) => {
  const { onWheel, ...rest } = options
  const instance = createWheel(node, onWheel, rest)
  let current = options
  return {
    update: (next) => {
      instance.update(replaceOptions(current, next))
      current = next
    },
    destroy: () => instance.destroy(),
  }
}
