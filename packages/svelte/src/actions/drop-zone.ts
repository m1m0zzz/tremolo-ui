import { createDropZone, type DropZoneOptions } from '@tremolo-ui/dom'

import { replacing } from './replacing.js'

import type { Action } from 'svelte/action'

/**
 * Take files dropped on the element. See `createDropZone` in
 * `@tremolo-ui/dom` for the options; `onStateChange` reports whether files
 * are over it, for styling the element while they are.
 *
 * @example
 * <div use:dropZone={{ accept: 'audio/*', onDrop: (files) => load(files) }}></div>
 */
export const dropZone: Action<Element, DropZoneOptions | undefined> = (
  node,
  options,
) => {
  const instance = createDropZone(node, options)
  let current = options
  return {
    update: (next) => {
      instance.update(replacing(current, next))
      current = next
    },
    destroy: () => instance.destroy(),
  }
}
