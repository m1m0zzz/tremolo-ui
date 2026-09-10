import { act, renderHook } from '@testing-library/react'

import { useEventListener } from './useEventListener'

describe('useEventListener', () => {
  test('the manual disposer removes the listener from its registered target', () => {
    const first = new EventTarget()
    const second = new EventTarget()
    const target = { current: first }
    const handler = vi.fn()

    const { result } = renderHook(() =>
      useEventListener(() => target.current, 'click', handler),
    )

    first.dispatchEvent(new Event('click'))
    expect(handler).toHaveBeenCalledTimes(1)

    target.current = second
    act(() => result.current())
    first.dispatchEvent(new Event('click'))

    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('returns the same disposer after a rerender', () => {
    const target = new EventTarget()
    const { result, rerender } = renderHook(() =>
      useEventListener(target, 'click', () => {}),
    )
    const dispose = result.current

    rerender()

    expect(result.current).toBe(dispose)
  })
})
