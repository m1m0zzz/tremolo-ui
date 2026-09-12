import { act, render } from '@testing-library/react'

import { useAnimationFrame } from './useAnimationFrame'

let flush: () => void
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

  flush = () => {
    const callbacks = [...queued.values()]
    queued.clear()
    for (const callback of callbacks) callback(performance.now())
  }
  pending = () => queued.size
  cancels = () => cancelled
}

beforeEach(stubAnimationFrame)

function Host({ callback, dep }: { callback: () => void; dep?: number }) {
  useAnimationFrame(callback, dep === undefined ? [] : [dep])
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

  test('a dependency change swaps the callback without doubling the loop', () => {
    const first = vi.fn()
    const second = vi.fn()

    const { rerender } = render(<Host callback={first} dep={0} />)
    act(() => flush())
    expect(first).toHaveBeenCalledTimes(1)

    rerender(<Host callback={second} dep={1} />)
    act(() => flush())

    expect(second).toHaveBeenCalledTimes(1)
    // The loop the old callback was closed over is gone, not left running.
    expect(first).toHaveBeenCalledTimes(1)
    expect(pending()).toBe(1)
  })
})
