import { flushSync } from 'svelte'

import { useMIDIAccess } from '../../src/hooks/useMIDIAccess.svelte'
import { useMIDIInput } from '../../src/hooks/useMIDIInput.svelte'

const original = navigator.requestMIDIAccess

function mockRequestMIDIAccess(access: MIDIAccess) {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: vi.fn(async () => access),
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: original,
    configurable: true,
    writable: true,
  })
})

/** A MIDIAccess with one input that can be made to send a message. */
function fakeAccess() {
  const listeners = new Set<(event: Event) => void>()
  const input = {
    name: 'keys',
    addEventListener: (_: string, fn: (event: Event) => void) =>
      listeners.add(fn),
    removeEventListener: (_: string, fn: (event: Event) => void) =>
      listeners.delete(fn),
  }
  const access = {
    inputs: new Map([['0', input]]),
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MIDIAccess
  const send = (data: number[]) => {
    const event = Object.assign(new Event('midimessage'), {
      data: new Uint8Array(data),
    })
    for (const fn of [...listeners]) fn(event)
  }
  return { access, send, listeners }
}

test('useMIDIAccess requests on mount and follows the access', async () => {
  const { access } = fakeAccess()
  mockRequestMIDIAccess(access)

  let midi!: ReturnType<typeof useMIDIAccess>
  const cleanup = $effect.root(() => {
    midi = useMIDIAccess()
  })
  flushSync()
  await vi.waitFor(() => expect(midi.midiAccess).toBe(access))
  expect(midi.inputs.map((i) => i.name)).toEqual(['keys'])

  cleanup()
  expect(midi.midiAccess).toBeNull()
})

test('useMIDIAccess waits for request() when told to', async () => {
  const { access } = fakeAccess()
  mockRequestMIDIAccess(access)

  let midi!: ReturnType<typeof useMIDIAccess>
  const cleanup = $effect.root(() => {
    midi = useMIDIAccess(false)
  })
  flushSync()
  expect(navigator.requestMIDIAccess).not.toHaveBeenCalled()
  midi.request()
  await vi.waitFor(() => expect(midi.midiAccess).toBe(access))
  cleanup()
})

test('useMIDIInput decodes the messages and swaps handlers in place', () => {
  const { access, send, listeners } = fakeAccess()
  const first = vi.fn()
  const second = vi.fn()
  let handler = $state(first)

  const cleanup = $effect.root(() => {
    useMIDIInput(
      () => access,
      () => ({ onNoteOnEvent: handler }),
    )
  })
  flushSync()
  send([0x90, 60, 100])
  expect(first).toHaveBeenCalledWith(60, 100, 0)

  handler = second
  flushSync()
  send([0x90, 62, 90])
  expect(second).toHaveBeenCalledWith(62, 90, 0)
  // Swapping the handler does not subscribe a second time.
  expect(listeners.size).toBe(1)

  cleanup()
  expect(listeners.size).toBe(0)
})
