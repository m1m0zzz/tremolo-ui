import { act, render } from '@testing-library/react'

import { useAnimationFrame } from './useAnimationFrame'

let flush: (timestamp?: number) => void
let pending: () => number
let cancels: () => number

/** jsdom does not drive requestAnimationFrame, so frames are stepped by hand. */
function stubAnimationFrame() {
  let nextId = 1
  let cancelled = 0
  const queued = new Map<number, FrameRequestCallback>()

  globalThis.requestAnimationFrame = (callback) => {
    const id = nextId++
    queued.set(id, callback)
    return id
  }
  globalThis.cancelAnimationFrame = (id) => {
    if (queued.delete(id)) cancelled++
  }

  flush = (timestamp = performance.now()) => {
    const callbacks = [...queued.values()]
    queued.clear()
    for (const callback of callbacks) callback(timestamp)
  }
  pending = () => queued.size
  cancels = () => cancelled
}

beforeEach(stubAnimationFrame)

function Host({
  callback,
  disabled,
}: {
  callback: () => void
  disabled?: boolean
}) {
  useAnimationFrame(callback, { disabled })
  return null
}

describe('useAnimationFrame', () => {
  test('keeps requesting the next frame', () => {
    const callback = vi.fn()
    render(<Host callback={callback} />)

    act(() => flush())
    act(() => flush())
    act(() => flush())

    expect(callback).toHaveBeenCalledTimes(3)
    // One loop, not one per frame.
    expect(pending()).toBe(1)
  })

  test('cancels the pending frame on unmount', () => {
    const callback = vi.fn()
    const { unmount } = render(<Host callback={callback} />)

    act(() => flush())
    unmount()

    expect(pending()).toBe(0)
    act(() => flush())
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('an inline callback does not restart the loop on every render', () => {
    const seen: number[] = []

    function Inline({ value }: { value: number }) {
      useAnimationFrame(() => seen.push(value))
      return null
    }

    const { rerender } = render(<Inline value={1} />)
    act(() => flush())
    rerender(<Inline value={2} />)

    // The loop the first render started is still the one running: a new
    // function identity is not a reason to cancel it.
    expect(cancels()).toBe(0)
    expect(pending()).toBe(1)

    act(() => flush())

    // Still the latest render's callback, ref or not.
    expect(seen).toEqual([1, 2])
  })

  test('passes the timestamp and the time since the previous frame', () => {
    const callback = vi.fn()
    render(<Host callback={callback} />)

    act(() => flush(1000))
    act(() => flush(1016))
    act(() => flush(1050))

    expect(callback.mock.calls).toEqual([
      [1000, 0],
      [1016, 16],
      [1050, 34],
    ])
  })

  test('disabled stops the loop, and turning it back on starts a new one', () => {
    const callback = vi.fn()
    const { rerender } = render(<Host callback={callback} />)
    act(() => flush(1000))

    rerender(<Host callback={callback} disabled />)
    expect(pending()).toBe(0)

    rerender(<Host callback={callback} />)
    act(() => flush(5000))

    // The time spent stopped is not reported as one long frame.
    expect(callback).toHaveBeenLastCalledWith(5000, 0)
    expect(pending()).toBe(1)
  })

  test('starts with nothing scheduled when disabled', () => {
    const callback = vi.fn()
    render(<Host callback={callback} disabled />)

    expect(pending()).toBe(0)
  })
})
