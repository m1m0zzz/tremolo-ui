import {
  createLongPress,
  replaceOptions,
  type LongPressOptions,
} from '@tremolo-ui/dom'

import type { Action } from 'svelte/action'

/**
 * Repeat `onPress` while the element is held down: once on the press, then
 * every `interval` after `delay`. See `createLongPress` in `@tremolo-ui/dom`.
 *
 * @example
 * <button use:longPress={{ onPress: () => value++ }}>+</button>
 */
export const longPress: Action<HTMLElement, LongPressOptions> = (
  node,
  options,
) => {
  const instance = createLongPress(options)
  const onPointerDown = (event: PointerEvent) => instance.start(event)
  node.addEventListener('pointerdown', onPointerDown)
  let current = options
  return {
    update: (next) => {
      instance.update(replaceOptions(current, next))
      current = next
    },
    destroy: () => {
      node.removeEventListener('pointerdown', onPointerDown)
      instance.destroy()
    },
  }
}
