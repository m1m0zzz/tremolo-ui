import { act, render } from '@testing-library/react'

import { useAnimationFrame } from './useAnimationFrame'

let flush: () => void
let pending: () => number

/** jsdom does not drive requestAnimationFrame, so frames are stepped by hand. */
function stubAnimationFrame() {
  let nextId = 1
  const queued = new Map<number, FrameRequestCallback>()

  globalThis.requestAnimationFrame = (callback) => {
    const id = nextId++
    queued.set(id, callback)
    return id
  }
  globalThis.cancelAnimationFrame = (id) => {
    queued.delete(id)
  }

  flush = () => {
    const callbacks = [...queued.values()]
    queued.clear()
    for (const callback of callbacks) callback(performance.now())
  }
  pending = () => queued.size
}

beforeEach(stubAnimationFrame)

function Host({ callback, dep }: { callback: () => void; dep?: number }) {
  useAnimationFrame(callback, dep === undefined ? [] : [dep])
  return null
}

describe('useAnimationFrame', () => {
  test('keeps requesting the next frame', () => {
    const callback = jest.fn()
    render(<Host callback={callback} />)

    act(() => flush())
    act(() => flush())
    act(() => flush())

    expect(callback).toHaveBeenCalledTimes(3)
    // One loop, not one per frame.
    expect(pending()).toBe(1)
  })

  test('cancels the pending frame on unmount', () => {
    const callback = jest.fn()
    const { unmount } = render(<Host callback={callback} />)

    act(() => flush())
    unmount()

    expect(pending()).toBe(0)
    act(() => flush())
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('a dependency change swaps the callback without doubling the loop', () => {
    const first = jest.fn()
    const second = jest.fn()

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
