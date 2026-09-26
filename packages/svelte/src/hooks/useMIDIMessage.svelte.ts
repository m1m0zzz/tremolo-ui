import { createMIDIMessage, type MIDIMessageInstance } from '@tremolo-ui/dom'

/**
 * Listen to raw `midimessage` events on every input. Call it while a
 * component is being initialised. For note and controller events,
 * `useMIDIInput` decodes the message for you.
 *
 * Both arguments are functions, read reactively as in `useMIDIInput`.
 */
export function useMIDIMessage(
  midiAccess: () => MIDIAccess | null,
  onMIDIMessage: () => (event: MIDIMessageEvent) => void,
) {
  let instance: MIDIMessageInstance | null = null

  $effect(() => {
    const current = createMIDIMessage(midiAccess(), onMIDIMessage())
    instance = current
    return () => {
      current.destroy()
      instance = null
    }
  })

  $effect(() => {
    instance?.update(onMIDIMessage())
  })
}
