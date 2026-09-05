export interface MIDIMessageInstance {
  /** Replace the handler, keeping the listeners in place. */
  update: (onMIDIMessage: (event: MIDIMessageEvent) => void) => void
  destroy: () => void
}

/**
 * Listen to raw `midimessage` events on every input of a MIDIAccess.
 *
 * The set of inputs is followed rather than sampled: MIDIAccess fires
 * `statechange` when a device is plugged in or unplugged, and the listeners
 * move with it. A keyboard connected after access was granted works without
 * the caller having to rebuild anything.
 *
 * Use this when you need more detail than {@link createMIDIInput} provides.
 */
export function createMIDIMessage(
  midiAccess: MIDIAccess | null,
  onMIDIMessage: (event: MIDIMessageEvent) => void,
): MIDIMessageInstance {
  let handler = onMIDIMessage

  /** Inputs this instance currently listens on. */
  const attached = new Set<MIDIInput>()

  const listener = (event: Event) => handler(event as MIDIMessageEvent)

  function sync() {
    if (!midiAccess) return
    const connected = new Set(midiAccess.inputs.values())

    for (const input of connected) {
      if (attached.has(input)) continue
      input.addEventListener('midimessage', listener)
      attached.add(input)
    }
    for (const input of [...attached]) {
      if (connected.has(input)) continue
      input.removeEventListener('midimessage', listener)
      attached.delete(input)
    }
  }

  sync()
  midiAccess?.addEventListener('statechange', sync)

  return {
    update: (next) => {
      handler = next
    },
    destroy: () => {
      midiAccess?.removeEventListener('statechange', sync)
      for (const input of attached) {
        input.removeEventListener('midimessage', listener)
      }
      attached.clear()
    },
  }
}
