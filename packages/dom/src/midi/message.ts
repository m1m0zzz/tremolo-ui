export interface MIDIMessageInstance {
  destroy: () => void
}

/**
 * Listen to raw `midimessage` events on every input of a MIDIAccess.
 *
 * Use this when you need more detail than {@link createMIDIInput} provides.
 */
export function createMIDIMessage(
  midiAccess: MIDIAccess | null,
  onMIDIMessage: (event: MIDIMessageEvent) => void,
): MIDIMessageInstance {
  if (!midiAccess) {
    return { destroy: () => {} }
  }

  const inputs = [...midiAccess.inputs.values()]
  for (const input of inputs) {
    input.addEventListener('midimessage', onMIDIMessage)
  }

  return {
    destroy: () => {
      for (const input of inputs) {
        input.removeEventListener('midimessage', onMIDIMessage)
      }
    },
  }
}
