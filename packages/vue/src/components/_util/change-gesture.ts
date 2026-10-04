import { onScopeDispose, watch, watchEffect } from 'vue'

import { createChangeGesture, type ChangeSource } from '@tremolo-ui/dom'

export interface ChangeGestureOptions<V> {
  /** The value now, read when a gesture starts. */
  value: () => V
  inactive: () => boolean
  endDelay: () => number | undefined
  onStart: (value: V, source: ChangeSource) => void
  onEnd: (value: V, source: ChangeSource) => void
}

/**
 * The core's change gesture, reporting the control's value: the start gets
 * the value before the change, the end the last one the control emitted.
 * `modelValue` lags behind until the parent renders, and a drag ends in the
 * same event as its last change, so the component reports each value it
 * emits through `changed`.
 */
export function useChangeGesture<V>(options: ChangeGestureOptions<V>) {
  let last = options.value()
  const gesture = createChangeGesture({
    onStart: (source) => {
      last = options.value()
      options.onStart(last, source)
    },
    onEnd: (source) => options.onEnd(last, source),
  })

  watchEffect(() => gesture.update({ endDelay: options.endDelay() }))
  // A control that turns inactive mid-gesture, or goes away, should not leave
  // a host thinking it is still being touched.
  watch(options.inactive, (inactive) => {
    if (inactive) gesture.end()
  })
  onScopeDispose(() => gesture.end())

  return Object.assign(gesture, {
    changed: (value: V) => {
      last = value
    },
  })
}
