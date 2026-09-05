import { useEffect, useRef } from 'react'

import {
  createMIDIInput,
  PITCH_BEND_CENTER,
  type MIDIInputHandlers,
  type MIDIInputInstance,
} from '@tremolo-ui/dom'

export { PITCH_BEND_CENTER, type MIDIInputHandlers }

/**
 * Handle MIDI input events. To be used with {@link useMIDIAccess}.
 *
 * The handlers are read fresh on every event, so writing them inline is fine:
 * the listeners are attached once per `midiAccess` and stay attached. Devices
 * plugged in later are picked up without anything having to be rebuilt.
 *
 * @example
 * const { midiAccess } = useMIDIAccess()
 * useMIDIInput(midiAccess, {
 *   onNoteOnEvent: (note, velocity) => play(note, velocity / 127),
 *   onNoteOffEvent: (note) => stop(note),
 *   onControlChangeEvent: (controller, value) => {
 *     if (controller === 1) setModulation(value / 127)
 *   },
 * })
 */
export function useMIDIInput(
  midiAccess: MIDIAccess | null,
  handlers: MIDIInputHandlers,
) {
  // Read when the instance is created. The effect below keeps it current, and
  // runs right after, so a stale handler is replaced within the same commit.
  const latest = useRef(handlers)
  const instanceRef = useRef<MIDIInputInstance | null>(null)

  useEffect(() => {
    const instance = createMIDIInput(midiAccess, latest.current)
    instanceRef.current = instance

    return () => {
      instanceRef.current = null
      instance.destroy()
    }
  }, [midiAccess])

  // Runs after every render: handlers come from props and are cheap to push,
  // and updating in place leaves the listeners untouched.
  useEffect(() => {
    latest.current = handlers
    instanceRef.current?.update(handlers)
  })
}
