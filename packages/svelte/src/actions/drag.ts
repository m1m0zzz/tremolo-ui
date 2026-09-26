import { createDrag, type DragOptions } from '@tremolo-ui/dom'

import { replacing } from './replacing.js'

import type { Action } from 'svelte/action'

/**
 * Track a pointer drag on the element. See `createDrag` in `@tremolo-ui/dom`
 * for the options.
 *
 * New options are handed to the drag in place, so changing them — a handler
 * that closes over state, say — does not end a drag in progress.
 *
 * @example
 * <div use:drag={{ onDrag: (state) => (x += state.deltaX) }}></div>
 */
export const drag: Action<Element, DragOptions | undefined> = (
  node,
  options,
) => {
  const instance = createDrag(node, options)
  let current = options
  return {
    update: (next) => {
      instance.update(replacing(current, next))
      current = next
    },
    destroy: () => instance.destroy(),
  }
}
