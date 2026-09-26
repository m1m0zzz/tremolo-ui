import { toValue, watch, type MaybeRefOrGetter } from 'vue'

import { createMIDIMessage } from '@tremolo-ui/dom'

/**
 * Listen to raw `midimessage` events on every input. Call it during `setup`.
 * For note and controller events, `useMIDIInput` decodes the message for you.
 */
export function useMIDIMessage(
  midiAccess: MaybeRefOrGetter<MIDIAccess | null>,
  onMIDIMessage: MaybeRefOrGetter<(event: MIDIMessageEvent) => void>,
) {
  let instance: ReturnType<typeof createMIDIMessage> | null = null
  watch(
    () => toValue(midiAccess),
    (access, _, onCleanup) => {
      const current = createMIDIMessage(access, toValue(onMIDIMessage))
      instance = current
      onCleanup(() => {
        current.destroy()
        if (instance === current) instance = null
      })
    },
    { immediate: true },
  )
  watch(
    () => toValue(onMIDIMessage),
    (next) => instance?.update(next),
  )
}
