import { type MaybeRefOrGetter } from 'vue'

import { createDragValue, type DragValueOptions } from '@tremolo-ui/dom'

import { useInstance } from './useInstance'

/**
 * Drive a value with a pointer drag. See `createDragValue` in
 * `@tremolo-ui/dom` for the options; `elementMapping` and `relativeMapping`
 * from there choose how the pointer becomes a value. `mapping` is read when
 * the element is attached.
 */
export function useDragValue(
  target: MaybeRefOrGetter<Element | null | undefined>,
  options: MaybeRefOrGetter<DragValueOptions>,
) {
  useInstance(target, options, createDragValue, (instance, next) =>
    instance.update(next),
  )
}
