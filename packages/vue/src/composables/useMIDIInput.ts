import { toValue, watch, type MaybeRefOrGetter } from 'vue'

import { createMIDIInput, type MIDIInputHandlers } from '@tremolo-ui/dom'

/**
 * Handle the channel voice messages of every connected input. Call it during
 * `setup`. See `createMIDIInput` in `@tremolo-ui/dom` for the handlers.
 *
 * The listeners follow `midiAccess` as it is granted, and new handlers
 * replace the old ones without re-subscribing.
 */
export function useMIDIInput(
  midiAccess: MaybeRefOrGetter<MIDIAccess | null>,
  handlers: MaybeRefOrGetter<MIDIInputHandlers>,
) {
  let instance: ReturnType<typeof createMIDIInput> | null = null
  watch(
    () => toValue(midiAccess),
    (access, _, onCleanup) => {
      const current = createMIDIInput(access, toValue(handlers))
      instance = current
      onCleanup(() => {
        current.destroy()
        if (instance === current) instance = null
      })
    },
    { immediate: true },
  )
  watch(
    () => toValue(handlers),
    (next) => instance?.update(next),
  )
}
