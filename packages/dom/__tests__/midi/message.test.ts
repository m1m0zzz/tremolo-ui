import { createMIDIMessage } from '../../src/midi/message'

import type { Mock } from 'vitest'

type FakeInput = {
  addEventListener: Mock
  removeEventListener: Mock
  /** Dispatches to whatever `midimessage` listener is attached. */
  send: (event: unknown) => void
}

function fakeInput(): FakeInput {
  const listeners = new Set<(event: unknown) => void>()
  return {
    addEventListener: vi.fn((type: string, fn: (event: unknown) => void) => {
      if (type === 'midimessage') listeners.add(fn)
    }),
    removeEventListener: vi.fn((type: string, fn: (event: unknown) => void) => {
      if (type === 'midimessage') listeners.delete(fn)
    }),
    send: (event) => {
      for (const listener of [...listeners]) listener(event)
    },
  }
}

/** A MIDIAccess whose input list can change, as it does when a device moves. */
function fakeAccess(...inputs: FakeInput[]) {
  const map = new Map(inputs.map((input, i) => [String(i), input]))
  const listeners = new Set<() => void>()

  return {
    access: {
      inputs: map,
      addEventListener: (type: string, fn: () => void) => {
        if (type === 'statechange') listeners.add(fn)
      },
      removeEventListener: (type: string, fn: () => void) => {
        if (type === 'statechange') listeners.delete(fn)
      },
    } as unknown as MIDIAccess,
    connect(input: FakeInput) {
      map.set(String(map.size), input)
      for (const listener of [...listeners]) listener()
    },
    disconnect(key: string) {
      map.delete(key)
      for (const listener of [...listeners]) listener()
    },
    statechangeListeners: listeners,
  }
}

describe('createMIDIMessage', () => {
  test('subscribes to every input and unsubscribes on destroy', () => {
    const a = fakeInput()
    const b = fakeInput()
    const { access } = fakeAccess(a, b)

    const instance = createMIDIMessage(access, vi.fn())

    expect(a.addEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    )
    expect(b.addEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    )

    instance.destroy()

    expect(a.removeEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    )
    expect(b.removeEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    )
  })

  test('a device plugged in later is picked up', () => {
    const a = fakeInput()
    const later = fakeInput()
    const harness = fakeAccess(a)
    const onMIDIMessage = vi.fn()

    createMIDIMessage(harness.access, onMIDIMessage)
    harness.connect(later)

    later.send({ data: new Uint8Array([0x90, 60, 100]) })
    expect(onMIDIMessage).toHaveBeenCalledTimes(1)
  })

  test('an input is subscribed to once, however often statechange fires', () => {
    const a = fakeInput()
    const harness = fakeAccess(a)

    createMIDIMessage(harness.access, vi.fn())
    harness.connect(fakeInput())
    harness.connect(fakeInput())

    expect(a.addEventListener).toHaveBeenCalledTimes(1)
  })

  test('an unplugged device is let go', () => {
    const a = fakeInput()
    const harness = fakeAccess(a)
    const onMIDIMessage = vi.fn()

    createMIDIMessage(harness.access, onMIDIMessage)
    const attached = a.addEventListener.mock.calls[0][1]
    harness.disconnect('0')

    expect(a.removeEventListener).toHaveBeenCalledWith('midimessage', attached)
    a.send({ data: new Uint8Array([0x90, 60, 100]) })
    expect(onMIDIMessage).not.toHaveBeenCalled()
  })

  test('destroy stops following the device list', () => {
    const a = fakeInput()
    const harness = fakeAccess(a)
    const onMIDIMessage = vi.fn()
    const instance = createMIDIMessage(harness.access, onMIDIMessage)

    instance.destroy()

    expect(harness.statechangeListeners.size).toBe(0)
    a.send({ data: new Uint8Array([0x90, 60, 100]) })
    expect(onMIDIMessage).not.toHaveBeenCalled()
  })

  test('update swaps the handler without touching the listeners', () => {
    const a = fakeInput()
    const harness = fakeAccess(a)
    const first = vi.fn()
    const second = vi.fn()

    const instance = createMIDIMessage(harness.access, first)
    instance.update(second)
    a.send({ data: new Uint8Array([0x90, 60, 100]) })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(a.removeEventListener).not.toHaveBeenCalled()
  })

  test('a null access is a no-op', () => {
    const instance = createMIDIMessage(null, vi.fn())
    expect(() => instance.update(vi.fn())).not.toThrow()
    expect(() => instance.destroy()).not.toThrow()
  })
})
