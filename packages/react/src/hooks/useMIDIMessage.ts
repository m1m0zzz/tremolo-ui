import { useEffect } from 'react'

import { createMIDIMessage } from '@tremolo-ui/dom'

/**
 * Hooks for when you want to process MIDI events in more detail than useMIDIInput.
 */
export function useMIDIMessage(
  midiAccess: MIDIAccess | null,
  onMIDIMessage: (event: MIDIMessageEvent) => void,
) {
  useEffect(() => {
    const instance = createMIDIMessage(midiAccess, onMIDIMessage)
    return () => instance.destroy()
  }, [midiAccess, onMIDIMessage])
}
