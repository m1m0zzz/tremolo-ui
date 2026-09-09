import {
  createMIDIAccess,
  NOT_SUPPORTED,
  PERMISSION_DENIED,
  UNAVAILABLE,
} from '../../src/midi/access'

const originalRequestMIDIAccess = navigator.requestMIDIAccess

function mockRequestMIDIAccess(
  impl: ((options?: MIDIOptions) => Promise<MIDIAccess>) | undefined,
) {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: impl,
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  mockRequestMIDIAccess(originalRequestMIDIAccess)
})

/** A MIDIAccess whose device list can change, as it does when one is moved. */
function fakeAccess(...inputs: MIDIInput[]) {
  const map = new Map(inputs.map((input, i) => [String(i), input]))
  const listeners = new Set<(event?: Event) => void>()

  return {
    access: {
      inputs: map,
      addEventListener: (type: string, fn: (event?: Event) => void) => {
        if (type === 'statechange') listeners.add(fn)
      },
      removeEventListener: (type: string, fn: (event?: Event) => void) => {
        if (type === 'statechange') listeners.delete(fn)
      },
    } as unknown as MIDIAccess,
    connect(input: MIDIInput) {
      map.set(String(map.size), input)
      for (const listener of [...listeners]) listener()
    },
    changeOutput() {
      const event = Object.assign(new Event('statechange'), {
        port: { type: 'output' },
      })
      for (const listener of [...listeners]) listener(event)
    },
    statechangeListeners: listeners,
  }
}

const input = (name: string) => ({ name }) as unknown as MIDIInput

/** A DOMException-shaped rejection, which is what browsers actually throw. */
const rejection = (name: string) => Object.assign(new Error(name), { name })

const EMPTY = { midiAccess: null, error: null, inputs: [] }

describe('createMIDIAccess', () => {
  test('initial state', () => {
    const instance = createMIDIAccess()
    expect(instance.getState()).toEqual(EMPTY)
  })

  test('getServerState returns a stable reference', () => {
    const instance = createMIDIAccess()
    expect(instance.getServerState()).toBe(instance.getServerState())
    expect(instance.getServerState()).toEqual(EMPTY)
  })

  test('NOT_SUPPORTED when the browser has no Web MIDI API', () => {
    mockRequestMIDIAccess(undefined)
    const instance = createMIDIAccess()
    instance.request()
    expect(instance.getState()).toEqual({
      midiAccess: null,
      error: NOT_SUPPORTED,
      inputs: [],
    })
  })

  test('resolves, lists the inputs and notifies subscribers', async () => {
    const a = input('a')
    const { access } = fakeAccess(a)
    mockRequestMIDIAccess(() => Promise.resolve(access))
    const instance = createMIDIAccess()
    const listener = vi.fn()
    instance.subscribe(listener)

    instance.request()
    await Promise.resolve()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(instance.getState()).toEqual({
      midiAccess: access,
      error: null,
      inputs: [a],
    })
  })

  test('sysex is off unless asked for', async () => {
    const request = vi.fn(() => Promise.resolve(fakeAccess().access))
    mockRequestMIDIAccess(request)

    createMIDIAccess().request()
    expect(request).toHaveBeenLastCalledWith({ sysex: false })

    createMIDIAccess().request({ sysex: true })
    expect(request).toHaveBeenLastCalledWith({ sysex: true })
  })

  test('a device plugged in later shows up in the state', async () => {
    const harness = fakeAccess(input('a'))
    mockRequestMIDIAccess(() => Promise.resolve(harness.access))
    const instance = createMIDIAccess()
    instance.request()
    await Promise.resolve()

    const listener = vi.fn()
    instance.subscribe(listener)
    const later = input('later')
    harness.connect(later)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(instance.getState().inputs).toEqual([expect.anything(), later])
  })

  test('an output-only state change does not notify input subscribers', async () => {
    const harness = fakeAccess(input('a'))
    mockRequestMIDIAccess(() => Promise.resolve(harness.access))
    const instance = createMIDIAccess()
    instance.request()
    await Promise.resolve()
    const listener = vi.fn()
    instance.subscribe(listener)

    harness.changeOutput()

    expect(listener).not.toHaveBeenCalled()
  })

  test.each([
    ['SecurityError', PERMISSION_DENIED],
    ['NotAllowedError', PERMISSION_DENIED],
    ['NotSupportedError', NOT_SUPPORTED],
    ['TypeError', NOT_SUPPORTED],
    ['AbortError', UNAVAILABLE],
    ['SomethingNewError', UNAVAILABLE],
  ])('%s becomes %s', async (name, expected) => {
    mockRequestMIDIAccess(() => Promise.reject(rejection(name)))
    const instance = createMIDIAccess()
    instance.request()
    await Promise.resolve()
    await Promise.resolve()

    expect(instance.getState().error).toBe(expected)
  })

  test('a rejection keeps the previously granted access', async () => {
    const a = input('a')
    const { access } = fakeAccess(a)
    mockRequestMIDIAccess(() => Promise.resolve(access))
    const instance = createMIDIAccess()
    instance.request()
    await Promise.resolve()

    mockRequestMIDIAccess(() => Promise.reject(rejection('NotAllowedError')))
    instance.request()
    await Promise.resolve()
    await Promise.resolve()

    expect(instance.getState()).toEqual({
      midiAccess: access,
      error: PERMISSION_DENIED,
      inputs: [a],
    })
  })

  test('unsubscribe stops notifications', () => {
    mockRequestMIDIAccess(undefined)
    const instance = createMIDIAccess()
    const listener = vi.fn()
    const unsubscribe = instance.subscribe(listener)

    unsubscribe()
    instance.request()

    expect(listener).not.toHaveBeenCalled()
  })

  test('destroy stops request from changing the state', async () => {
    mockRequestMIDIAccess(() => Promise.resolve(fakeAccess().access))
    const instance = createMIDIAccess()
    const listener = vi.fn()
    instance.subscribe(listener)

    instance.destroy()
    instance.request()
    await Promise.resolve()

    expect(listener).not.toHaveBeenCalled()
    expect(instance.getState()).toEqual(EMPTY)
  })

  test('destroy ignores a request that resolves afterwards', async () => {
    let resolve!: (access: MIDIAccess) => void
    mockRequestMIDIAccess(
      () => new Promise<MIDIAccess>((next) => (resolve = next)),
    )
    const harness = fakeAccess(input('late'))
    const instance = createMIDIAccess()
    instance.request()
    instance.destroy()
    resolve(harness.access)
    await Promise.resolve()

    expect(instance.getState()).toEqual(EMPTY)
    expect(harness.statechangeListeners.size).toBe(0)
  })

  test('only the newest overlapping request can become active', async () => {
    const resolvers: ((access: MIDIAccess) => void)[] = []
    mockRequestMIDIAccess(
      () => new Promise<MIDIAccess>((resolve) => resolvers.push(resolve)),
    )
    const old = fakeAccess(input('old'))
    const current = fakeAccess(input('current'))
    const instance = createMIDIAccess()
    instance.request()
    instance.request()

    resolvers[1](current.access)
    await Promise.resolve()
    resolvers[0](old.access)
    await Promise.resolve()

    expect(instance.getState().midiAccess).toBe(current.access)
    expect(instance.getState().inputs[0]?.name).toBe('current')
    expect(old.statechangeListeners.size).toBe(0)
    expect(current.statechangeListeners.size).toBe(1)
  })

  test('destroy stops following the device list', async () => {
    const harness = fakeAccess(input('a'))
    mockRequestMIDIAccess(() => Promise.resolve(harness.access))
    const instance = createMIDIAccess()
    instance.request()
    await Promise.resolve()

    instance.destroy()

    expect(harness.statechangeListeners.size).toBe(0)
  })
})
