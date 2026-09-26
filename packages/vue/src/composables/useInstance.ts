import { toValue, watch, type MaybeRefOrGetter } from 'vue'

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
  O,
  I extends { destroy: () => void },
>(
  target: MaybeRefOrGetter<E | null | undefined>,
  options: MaybeRefOrGetter<O>,
  create: (element: E, options: O) => I,
  update: (instance: I, options: O) => void,
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

  watch(
    () => toValue(options),
    (next) => {
      if (instance) update(instance, next)
    },
    { flush: 'post' },
  )

  return { current: () => instance }
}
