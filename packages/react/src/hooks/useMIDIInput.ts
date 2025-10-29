import { useCallback } from 'react'

import { useMIDIMessage } from './useMIDIMessage'

const MIDI_EVENT_TO_NUMBER = {
  NOTE_ON: 0x90,
  NOTE_OFF: 0x80,
  PITCH_BEND: 0xe0,
}

// const NUMBER_TO_MIDI_EVENT: Record<number, string> = {
//   0x90: 'NOTE_ON',
//   0x80: 'NOTE_OFF',
//   0xe0: 'PITCH_BEND',
// }

/**
 * Hooks for handling note on/off events. To be used with useMIDIAccess. Internally uses useMIDIMessage.
 * @category hooks
 */
export function useMIDIInput(
  midiAccess: MIDIAccess | null,
  onNoteOnEvent?: (note: number, velocity: number) => void,
  onNoteOffEvent?: (note: number) => void,
  onPitchBendEvent?: (msb: number, lsb: number) => void,
) {
  const handleMIDIMessage = useCallback(
    (event: MIDIMessageEvent) => {
      if (!event.data) return
      // event.data[0] ... command
      // event.data[1] ... note, MSB (Most Significant Byte)
      // event.data[2] ... velocity, LSB (Least Significant Byte)
      const kind = event.data[0] & 0xf0

      if (
        kind == MIDI_EVENT_TO_NUMBER.NOTE_OFF ||
        (kind == MIDI_EVENT_TO_NUMBER.NOTE_ON && event.data[2] == 0)
      ) {
        onNoteOffEvent?.(event.data[1])
      } else if (kind == MIDI_EVENT_TO_NUMBER.NOTE_ON) {
        onNoteOnEvent?.(event.data[1], event.data[2])
      } else if (kind == MIDI_EVENT_TO_NUMBER.PITCH_BEND) {
        onPitchBendEvent?.(event.data[1], event.data[2])
      }
    },
    [onNoteOffEvent, onNoteOnEvent, onPitchBendEvent],
  )

  useMIDIMessage(midiAccess, handleMIDIMessage)
}
