import { toValue, watch, type MaybeRefOrGetter } from 'vue'

import { replaceOptions } from '@tremolo-ui/dom'

/**
 * Create an instance for the element `target` holds, and destroy it when the
 * element goes away or changes. Options are pushed to the instance with
 * `update` as they change, so that changing them does not interrupt a drag in
 * progress.
 *
 * Call it during `setup`: the watchers stop with the component.
 */
export function useInstance<
  E extends Element,
  O extends object,
  I extends { destroy: () => void },
>(
  target: MaybeRefOrGetter<E | null | undefined>,
  options: MaybeRefOrGetter<O>,
  create: (element: E, options: O) => I,
  update: (instance: I, options: Partial<O>) => void,
): { current: () => I | null } {
  let instance: I | null = null

  watch(
    () => toValue(target),
    (element, _, onCleanup) => {
      if (!element) return
      const current = create(element, toValue(options))
      instance = current
      onCleanup(() => {
        current.destroy()
        if (instance === current) instance = null
      })
    },
    { immediate: true, flush: 'post' },
  )

  // A copy, so that the watch reads every property: a `reactive()` object
  // whose `requireFocus` changes is then seen, not only a new object. The
  // copy is what the instance is left with — what it no longer carries is
  // cleared rather than kept.
  watch(
    () => ({ ...toValue(options) }),
    (next, previous) => {
      if (instance) update(instance, replaceOptions(previous, next))
    },
    { flush: 'post' },
  )

  return { current: () => instance }
}
