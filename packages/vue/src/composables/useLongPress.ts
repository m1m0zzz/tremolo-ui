import { onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { createLongPress, type LongPressOptions } from '@tremolo-ui/dom'

/**
 * Repeat `onPress` while a pointer is held down: once on the press, then
 * every `interval` after `delay`. See `createLongPress` in `@tremolo-ui/dom`.
 *
 * Returns the function that starts a press, for `@pointerdown`.
 */
export function useLongPress(options: MaybeRefOrGetter<LongPressOptions>) {
  const instance = createLongPress(toValue(options))
  watch(
    () => toValue(options),
    (next) => instance.update(next),
  )
  onScopeDispose(() => instance.destroy())
  return (event?: Pick<PointerEvent, 'button' | 'pointerId'>) =>
    instance.start(event)
}
