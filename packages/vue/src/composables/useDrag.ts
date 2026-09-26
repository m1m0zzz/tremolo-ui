import { type MaybeRefOrGetter } from 'vue'

import { createDrag, type DragOptions } from '@tremolo-ui/dom'

import { useInstance } from './useInstance'

/**
 * Track a pointer drag on an element. See `createDrag` in `@tremolo-ui/dom`
 * for the options.
 *
 * @example
 * const el = useTemplateRef('el')
 * useDrag(el, { onDrag: (state) => (x.value += state.deltaX) })
 */
export function useDrag(
  target: MaybeRefOrGetter<Element | null | undefined>,
  options: MaybeRefOrGetter<DragOptions> = {},
) {
  useInstance(target, options, createDrag, (instance, next) =>
    instance.update(next),
  )
}
