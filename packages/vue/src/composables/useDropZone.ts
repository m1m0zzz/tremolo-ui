import { shallowRef, toValue, type MaybeRefOrGetter } from 'vue'

import {
  createDropZone,
  type DropZoneOptions,
  type DropZoneState,
} from '@tremolo-ui/dom'

import { useInstance } from './useInstance'

/**
 * Take files dropped on an element. See `createDropZone` in
 * `@tremolo-ui/dom`. Returns whether files are over it, and whether they
 * would be refused, for styling it while they are.
 */
export function useDropZone(
  target: MaybeRefOrGetter<Element | null | undefined>,
  options: MaybeRefOrGetter<DropZoneOptions> = {},
) {
  const state = shallowRef<DropZoneState>({ over: false, invalid: false })
  const withState = () => ({
    ...toValue(options),
    onStateChange: (next: DropZoneState) => {
      state.value = next
      toValue(options).onStateChange?.(next)
    },
  })
  useInstance(target, withState, createDropZone, (instance, next) =>
    instance.update(next),
  )
  return state
}
