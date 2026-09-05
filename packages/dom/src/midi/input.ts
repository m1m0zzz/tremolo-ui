import { createMIDIMessage, type MIDIMessageInstance } from './message'

const MIDI_EVENT_TO_NUMBER = {
  NOTE_ON: 0x90,
  NOTE_OFF: 0x80,
  PITCH_BEND: 0xe0,
}

export type MIDIInputHandlers = {
  onNoteOnEvent?: (note: number, velocity: number) => void
  onNoteOffEvent?: (note: number) => void
  onPitchBendEvent?: (msb: number, lsb: number) => void
}

export type MIDIInputInstance = MIDIMessageInstance

/**
 * Handle note on/off and pitch bend events. To be used with {@link createMIDIAccess}.
 * Internally uses {@link createMIDIMessage}.
 */
export function createMIDIInput(
  midiAccess: MIDIAccess | null,
  { onNoteOnEvent, onNoteOffEvent, onPitchBendEvent }: MIDIInputHandlers,
): MIDIInputInstance {
  return createMIDIMessage(midiAccess, (event) => {
    if (!event.data) return
    // event.data[0] ... command
    // event.data[1] ... note, MSB (Most Significant Byte)
    // event.data[2] ... velocity, LSB (Least Significant Byte)
    const kind = event.data[0] & 0xf0

    if (
      kind === MIDI_EVENT_TO_NUMBER.NOTE_OFF ||
      (kind === MIDI_EVENT_TO_NUMBER.NOTE_ON && event.data[2] === 0)
    ) {
      onNoteOffEvent?.(event.data[1])
    } else if (kind === MIDI_EVENT_TO_NUMBER.NOTE_ON) {
      onNoteOnEvent?.(event.data[1], event.data[2])
    } else if (kind === MIDI_EVENT_TO_NUMBER.PITCH_BEND) {
      onPitchBendEvent?.(event.data[1], event.data[2])
    }
  })
}
