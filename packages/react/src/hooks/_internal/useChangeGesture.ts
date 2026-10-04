import {
  useCallback,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  createChangeGesture,
  type ChangeGestureInstance,
  type ChangeSource,
} from '@tremolo-ui/dom'

export interface ChangeGestureProps<V> {
  onChangeStart?: (value: V, source: ChangeSource) => void
  onChangeEnd?: (value: V, source: ChangeSource) => void
  changeEndDelay?: number
}

export type ChangeGesture<V> = Pick<
  ChangeGestureInstance,
  'hold' | 'pulse' | 'instant' | 'end' | 'active'
> & {
  /**
   * Record a value the control has just reported through `onChange`, for
   * `onChangeEnd` to give. The prop lags behind until the parent renders, and
   * a drag ends in the same event as its last change.
   */
  changed: (value: V) => void
}

/**
 * The core's change gesture, reporting the control's value to
 * `onChangeStart` / `onChangeEnd`. The start gets the value before the change,
 * the end the last one reported.
 *
 * Internal
 * @private
 */
export function useChangeGesture<V>(
  value: V,
  { onChangeStart, onChangeEnd, changeEndDelay }: ChangeGestureProps<V>,
  inactive: boolean,
): ChangeGesture<V> {
  const [instance] = useState(() => createChangeGesture())
  const latest = useRef({ value, onChangeStart, onChangeEnd })
  // What `onChangeEnd` gives: the value at the start, then each one reported.
  const lastValue = useRef(value)

  useInsertionEffect(() => {
    latest.current = { value, onChangeStart, onChangeEnd }
  })

  // The callbacks are handed over here rather than at creation: they read the
  // refs, which belong outside render. Nothing can start a gesture before the
  // element is mounted, so they are in place by the first event.
  useEffect(() => {
    instance.update({
      endDelay: changeEndDelay,
      onStart: (source) => {
        lastValue.current = latest.current.value
        latest.current.onChangeStart?.(latest.current.value, source)
      },
      onEnd: (source) =>
        latest.current.onChangeEnd?.(lastValue.current, source),
    })
  }, [instance, changeEndDelay])

  // A control that turns inactive mid-gesture, or goes away, should not leave
  // a host thinking it is still being touched.
  useEffect(() => {
    if (inactive) instance.end()
  }, [instance, inactive])
  useEffect(() => () => instance.end(), [instance])

  const changed = useCallback((next: V) => {
    lastValue.current = next
  }, [])

  return useMemo(
    () => ({
      hold: instance.hold,
      pulse: instance.pulse,
      instant: instance.instant,
      end: instance.end,
      active: instance.active,
      changed,
    }),
    [instance, changed],
  )
}
