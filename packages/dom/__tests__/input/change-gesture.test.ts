import { createChangeGesture } from '../../src/input/change-gesture'

function setup(endDelay?: number) {
  const events: string[] = []
  const gesture = createChangeGesture({
    onStart: (source) => events.push(`start:${source}`),
    onEnd: (source) => events.push(`end:${source}`),
    endDelay,
  })
  return { events, gesture }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createChangeGesture', () => {
  test('a held gesture lasts until end', () => {
    const { events, gesture } = setup()

    gesture.hold('pointer')
    vi.advanceTimersByTime(10_000)
    expect(gesture.active()).toBe(true)
    gesture.end()

    expect(events).toEqual(['start:pointer', 'end:pointer'])
    expect(gesture.active()).toBe(false)
  })

  test('pulses of the same kind make one gesture that ends after the delay', () => {
    const { events, gesture } = setup(300)

    gesture.pulse('wheel')
    vi.advanceTimersByTime(200)
    gesture.pulse('wheel')
    vi.advanceTimersByTime(200)
    expect(events).toEqual(['start:wheel'])

    vi.advanceTimersByTime(100)
    expect(events).toEqual(['start:wheel', 'end:wheel'])
  })

  test('the delay defaults to 500 ms', () => {
    const { events, gesture } = setup()

    gesture.pulse('keyboard')
    vi.advanceTimersByTime(499)
    expect(events).toEqual(['start:keyboard'])
    vi.advanceTimersByTime(1)
    expect(events).toEqual(['start:keyboard', 'end:keyboard'])
  })

  test('a pulse of another kind ends the one in progress first', () => {
    const { events, gesture } = setup()

    gesture.pulse('wheel')
    gesture.pulse('keyboard')

    expect(events).toEqual(['start:wheel', 'end:wheel', 'start:keyboard'])
  })

  test('a pulse during a held gesture belongs to it', () => {
    const { events, gesture } = setup()

    gesture.hold('pointer')
    gesture.pulse('wheel')
    vi.advanceTimersByTime(1000)
    gesture.end()

    expect(events).toEqual(['start:pointer', 'end:pointer'])
  })

  test('holding ends a timed gesture in progress', () => {
    const { events, gesture } = setup()

    gesture.pulse('wheel')
    gesture.hold('pointer')
    vi.advanceTimersByTime(1000)

    // The wheel's timer is gone with it, so it cannot end the drag.
    expect(events).toEqual(['start:wheel', 'end:wheel', 'start:pointer'])
  })

  test('an instant gesture brackets the change it makes', () => {
    const { events, gesture } = setup()

    gesture.instant('doubleClick', () => events.push('change'))

    expect(events).toEqual(['start:doubleClick', 'change', 'end:doubleClick'])
  })

  test('destroy ends a gesture in progress', () => {
    const { events, gesture } = setup()

    gesture.pulse('wheel')
    gesture.destroy()
    vi.advanceTimersByTime(1000)

    expect(events).toEqual(['start:wheel', 'end:wheel'])
  })

  test('update replaces the callbacks and the delay', () => {
    const { events, gesture } = setup()
    const onEnd = vi.fn()

    gesture.update({ endDelay: 100, onEnd })
    gesture.pulse('wheel')
    vi.advanceTimersByTime(100)

    expect(events).toEqual(['start:wheel'])
    expect(onEnd).toHaveBeenCalledWith('wheel')
  })
})
