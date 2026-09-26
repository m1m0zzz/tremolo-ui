import { type MaybeRefOrGetter } from 'vue'

import { createWheel, type WheelOptions } from '@tremolo-ui/dom'

import { useInstance } from './useInstance'

/**
 * Listen to the wheel on an element, as a non-passive listener so that
 * `preventDefault()` can keep the page from scrolling. See `createWheel` in
 * `@tremolo-ui/dom`.
 */
export function useWheel(
  target: MaybeRefOrGetter<Element | null | undefined>,
  onWheel: (event: WheelEvent) => void,
  options: MaybeRefOrGetter<WheelOptions> = {},
) {
  useInstance(
    target,
    options,
    (element, opts) => createWheel(element, (event) => onWheel(event), opts),
    (instance, next) => instance.update(next),
  )
}
