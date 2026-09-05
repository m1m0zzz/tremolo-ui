import { useEffect, useRef } from 'react'

import { createMIDIMessage, type MIDIMessageInstance } from '@tremolo-ui/dom'

/**
 * Hooks for when you want to process MIDI events in more detail than useMIDIInput.
 *
 * The handler is read fresh on every event, so writing it inline is fine: the
 * listeners are attached once per `midiAccess` and stay attached, and devices
 * plugged in later are picked up.
 */
export function useMIDIMessage(
  midiAccess: MIDIAccess | null,
  onMIDIMessage: (event: MIDIMessageEvent) => void,
) {
  const latest = useRef(onMIDIMessage)
  const instanceRef = useRef<MIDIMessageInstance | null>(null)

  useEffect(() => {
    const instance = createMIDIMessage(midiAccess, (event) =>
      latest.current(event),
    )
    instanceRef.current = instance

    return () => {
      instanceRef.current = null
      instance.destroy()
    }
  }, [midiAccess])

  useEffect(() => {
    latest.current = onMIDIMessage
  })
}
