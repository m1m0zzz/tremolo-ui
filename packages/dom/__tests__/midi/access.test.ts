import {
  createMIDIAccess,
  NOT_SUPPORTED,
  PERMISSION_DENIED,
} from '../../src/midi/access'

const originalRequestMIDIAccess = navigator.requestMIDIAccess

function mockRequestMIDIAccess(impl: (() => Promise<MIDIAccess>) | undefined) {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: impl,
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  mockRequestMIDIAccess(originalRequestMIDIAccess)
})

const fakeAccess = {} as MIDIAccess

describe('createMIDIAccess', () => {
  test('initial state', () => {
    const instance = createMIDIAccess()
    expect(instance.getState()).toEqual({ midiAccess: null, error: null })
  })

  test('getServerState returns a stable reference', () => {
    const instance = createMIDIAccess()
    expect(instance.getServerState()).toBe(instance.getServerState())
    expect(instance.getServerState()).toEqual({ midiAccess: null, error: null })
  })

  test('NOT_SUPPORTED when the browser has no Web MIDI API', () => {
    mockRequestMIDIAccess(undefined)
    const instance = createMIDIAccess()
    instance.request()
    expect(instance.getState()).toEqual({
      midiAccess: null,
      error: NOT_SUPPORTED,
    })
  })

  test('resolves and notifies subscribers', async () => {
    mockRequestMIDIAccess(() => Promise.resolve(fakeAccess))
    const instance = createMIDIAccess()
    const listener = jest.fn()
    instance.subscribe(listener)

    instance.request()
    await Promise.resolve()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(instance.getState()).toEqual({
      midiAccess: fakeAccess,
      error: null,
    })
  })

  test('PERMISSION_DENIED keeps the previously granted access', async () => {
    mockRequestMIDIAccess(() => Promise.resolve(fakeAccess))
    const instance = createMIDIAccess()
    instance.request()
    await Promise.resolve()

    mockRequestMIDIAccess(() => Promise.reject(new Error('denied')))
    instance.request()
    await Promise.resolve()
    await Promise.resolve()

    expect(instance.getState()).toEqual({
      midiAccess: fakeAccess,
      error: PERMISSION_DENIED,
    })
  })

  test('unsubscribe stops notifications', () => {
    mockRequestMIDIAccess(undefined)
    const instance = createMIDIAccess()
    const listener = jest.fn()
    const unsubscribe = instance.subscribe(listener)

    unsubscribe()
    instance.request()

    expect(listener).not.toHaveBeenCalled()
  })

  test('destroy stops request from changing the state', async () => {
    mockRequestMIDIAccess(() => Promise.resolve(fakeAccess))
    const instance = createMIDIAccess()
    const listener = jest.fn()
    instance.subscribe(listener)

    instance.destroy()
    instance.request()
    await Promise.resolve()

    expect(listener).not.toHaveBeenCalled()
    expect(instance.getState()).toEqual({ midiAccess: null, error: null })
  })
})
