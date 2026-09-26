import {
  createMIDIInput,
  type MIDIInputHandlers,
  type MIDIInputInstance,
} from '@tremolo-ui/dom'

/**
 * Handle the channel voice messages of every connected input. Call it while
 * a component is being initialised. See `createMIDIInput` in
 * `@tremolo-ui/dom` for the handlers.
 *
 * Both arguments are functions, so that the access and the handlers are read
 * reactively: the listeners follow the access as it is granted, and new
 * handlers replace the old ones without re-subscribing.
 *
 * @example
 * const midi = useMIDIAccess()
 * useMIDIInput(() => midi.midiAccess, () => ({
 *   onNoteOnEvent: (note, velocity) => play(note, velocity / 127),
 * }))
 */
export function useMIDIInput(
  midiAccess: () => MIDIAccess | null,
  handlers: () => MIDIInputHandlers,
) {
  let instance: MIDIInputInstance | null = null

  $effect(() => {
    const current = createMIDIInput(midiAccess(), handlers())
    instance = current
    return () => {
      current.destroy()
      instance = null
    }
  })

  $effect(() => {
    instance?.update(handlers())
  })
}
