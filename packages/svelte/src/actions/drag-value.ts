import {
  createDragValue,
  replaceOptions,
  type DragValueOptions,
} from '@tremolo-ui/dom'

import type { Action } from 'svelte/action'

/**
 * Drive a value with a pointer drag. See `createDragValue` in
 * `@tremolo-ui/dom` for the options; `elementMapping` and `relativeMapping`
 * from there choose how the pointer becomes a value.
 *
 * `mapping` is fixed when the action starts. Everything else is handed to the
 * drag in place, so changing it does not end a drag in progress.
 *
 * @example
 * <div
 *   use:dragValue={{
 *     axis: { min: 0, max: 100 },
 *     mapping: relativeMapping({ pixelRange: 200 }),
 *     getValue: () => [value, value],
 *     onChange: ([, y]) => (value = y),
 *   }}
 * ></div>
 */
export const dragValue: Action<Element, DragValueOptions> = (node, options) => {
  const instance = createDragValue(node, options)
  let current = options
  return {
    update: (next) => {
      instance.update(replaceOptions(current, next))
      current = next
    },
    destroy: () => instance.destroy(),
  }
}
