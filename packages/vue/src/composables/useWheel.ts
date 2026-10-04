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
  // `onWheel` is left out: the handler is the second argument, and an option
  // of the same name would replace it on the first update.
  options: MaybeRefOrGetter<Omit<WheelOptions, 'onWheel'>> = {},
) {
  useInstance(
    target,
    options,
    (element, opts) =>
      createWheel(element, { ...opts, onWheel: (event) => onWheel(event) }),
    (instance, next) => instance.update(next),
  )
}
