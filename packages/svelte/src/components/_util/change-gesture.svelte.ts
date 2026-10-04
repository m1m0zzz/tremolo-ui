import { createChangeGesture, type ChangeSource } from '@tremolo-ui/dom'

export interface ChangeGestureState<V> {
  value: V
  inactive: boolean
  onChangeStart?: (value: V, source: ChangeSource) => void
  onChangeEnd?: (value: V, source: ChangeSource) => void
  changeEndDelay?: number
}

/**
 * The core's change gesture, reporting the control's value to
 * `onChangeStart` / `onChangeEnd`: the start gets the value before the change,
 * the end the value it ended on. The value is written by the component before
 * `onChange` is called, so reading it at the end is the last one reported.
 *
 * Takes a getter, so that the callbacks and the delay are read as they are now.
 */
export function useChangeGesture<V>(state: () => ChangeGestureState<V>) {
  const gesture = createChangeGesture({
    onStart: (source) => state().onChangeStart?.(state().value, source),
    onEnd: (source) => state().onChangeEnd?.(state().value, source),
  })

  $effect(() => {
    gesture.update({ endDelay: state().changeEndDelay })
  })
  // A control that turns inactive mid-gesture, or goes away, should not leave
  // a host thinking it is still being touched.
  $effect(() => {
    if (state().inactive) gesture.end()
  })
  $effect(() => () => gesture.end())

  return gesture
}
