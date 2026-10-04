import { createWheel, type WheelOptions } from '@tremolo-ui/dom'
import { replaceOptions } from '@tremolo-ui/dom/internal'

import type { Action } from 'svelte/action'

/**
 * Listen to the wheel on the element, as a non-passive listener so that
 * `preventDefault()` can keep the page from scrolling. See `createWheel` in
 * `@tremolo-ui/dom`.
 *
 * @example
 * <div use:wheel={{ onWheel: (e) => { e.preventDefault(); … }, requireFocus: true }}></div>
 */
export const wheel: Action<Element, WheelOptions> = (node, options) => {
  const instance = createWheel(node, options)
  let current = options
  return {
    update: (next) => {
      instance.update(replaceOptions(current, next))
      current = next
    },
    destroy: () => instance.destroy(),
  }
}
