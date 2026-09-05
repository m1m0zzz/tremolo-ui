import { createMIDIMessage } from './message'

/** Status byte of each channel message, with the channel nibble cleared. */
const STATUS = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  AFTERTOUCH: 0xa0,
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
  CHANNEL_PRESSURE: 0xd0,
  PITCH_BEND: 0xe0,
}

/**
 * Centre of the 14-bit pitch bend range: no bend.
 *
 * The range is not symmetric — 0 is 8192 below centre and 16383 is 8191 above
 * — so a wheel at rest reports exactly this rather than half of the maximum.
 */
export const PITCH_BEND_CENTER = 8192

/**
 * Every handler is given the channel last, as 0-15. MIDI channels are written
 * 1-16 on hardware, so add one before showing it to anyone.
 */
export type MIDIInputHandlers = {
  onNoteOnEvent?: (note: number, velocity: number, channel: number) => void
  onNoteOffEvent?: (note: number, channel: number) => void
  /**
   * The 14-bit bend, 0-16383, centred at {@link PITCH_BEND_CENTER}.
   *
   * The two data bytes are little-endian — the first carries the low 7 bits —
   * which is the other way round from every other message.
   */
  onPitchBendEvent?: (value: number, channel: number) => void
  /** `controller` is the CC number, `value` is 0-127. */
  onControlChangeEvent?: (
    controller: number,
    value: number,
    channel: number,
  ) => void
  onProgramChangeEvent?: (program: number, channel: number) => void
  /** Pressure for one held note (polyphonic aftertouch). */
  onAftertouchEvent?: (note: number, pressure: number, channel: number) => void
  /** Pressure for the whole channel, sent by keyboards with one sensor. */
  onChannelPressureEvent?: (pressure: number, channel: number) => void
}

export interface MIDIInputInstance {
  /** Replace the handlers, keeping the listeners in place. */
  update: (handlers: MIDIInputHandlers) => void
  destroy: () => void
}

/**
 * Handle the channel voice messages of every connected input. To be used with
 * {@link createMIDIAccess}. Internally uses {@link createMIDIMessage}, so
 * devices plugged in later are picked up.
 *
 * System messages (clock, sysex, and the rest of `0xf0`-`0xff`) are not
 * decoded here; reach for {@link createMIDIMessage} for those.
 */
export function createMIDIInput(
  midiAccess: MIDIAccess | null,
  handlers: MIDIInputHandlers,
): MIDIInputInstance {
  let current = handlers

  const message = createMIDIMessage(midiAccess, (event) => {
    if (!event.data || event.data.length === 0) return

    const status = event.data[0]
    // 0xf0 and above are system messages, which carry no channel.
    if (status >= 0xf0) return

    const kind = status & 0xf0
    const channel = status & 0x0f
    const first = event.data[1] ?? 0
    const second = event.data[2] ?? 0

    switch (kind) {
      case STATUS.NOTE_OFF:
        current.onNoteOffEvent?.(first, channel)
        break
      case STATUS.NOTE_ON:
        // A note on with zero velocity is how most devices say note off.
        if (second === 0) current.onNoteOffEvent?.(first, channel)
        else current.onNoteOnEvent?.(first, second, channel)
        break
      case STATUS.AFTERTOUCH:
        current.onAftertouchEvent?.(first, second, channel)
        break
      case STATUS.CONTROL_CHANGE:
        current.onControlChangeEvent?.(first, second, channel)
        break
      case STATUS.PROGRAM_CHANGE:
        current.onProgramChangeEvent?.(first, channel)
        break
      case STATUS.CHANNEL_PRESSURE:
        current.onChannelPressureEvent?.(first, channel)
        break
      case STATUS.PITCH_BEND:
        current.onPitchBendEvent?.((second << 7) | first, channel)
        break
    }
  })

  return {
    update: (next) => {
      current = next
    },
    destroy: message.destroy,
  }
}
