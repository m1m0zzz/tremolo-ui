import { useEffect } from 'react'

export function useMIDIMessage(
  midiAccess: MIDIAccess | null,
  onMIDIMessage: (event: MIDIMessageEvent) => void,
) {
  useEffect(() => {
    if (!midiAccess) return

    for (const input of midiAccess.inputs.values()) {
      input.addEventListener('midimessage', onMIDIMessage)
    }

    return () => {
      for (const input of midiAccess.inputs.values()) {
        input.removeEventListener('midimessage', onMIDIMessage)
      }
    }
  }, [midiAccess, onMIDIMessage])
}
