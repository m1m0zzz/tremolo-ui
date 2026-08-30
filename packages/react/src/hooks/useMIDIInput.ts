import { useEffect } from 'react'

import { createMIDIInput } from '@tremolo-ui/dom'

/**
 * Hooks for handling note on/off events. To be used with useMIDIAccess. Internally uses useMIDIMessage.
 */
export function useMIDIInput(
  midiAccess: MIDIAccess | null,
  onNoteOnEvent?: (note: number, velocity: number) => void,
  onNoteOffEvent?: (note: number) => void,
  onPitchBendEvent?: (msb: number, lsb: number) => void,
) {
  useEffect(() => {
    const instance = createMIDIInput(midiAccess, {
      onNoteOnEvent,
      onNoteOffEvent,
      onPitchBendEvent,
    })
    return () => instance.destroy()
  }, [midiAccess, onNoteOnEvent, onNoteOffEvent, onPitchBendEvent])
}
