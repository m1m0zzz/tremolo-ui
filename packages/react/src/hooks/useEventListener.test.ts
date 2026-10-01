import { act, renderHook } from '@testing-library/react'

import {
  useEventListener,
  type UseEventListenerOptions,
  type UseEventListenerTarget,
} from './useEventListener'

/** Counts how often a listener is added to and removed from the target. */
function spyTarget() {
  const target = new EventTarget()
  const add = vi.spyOn(target, 'addEventListener')
  const remove = vi.spyOn(target, 'removeEventListener')
  return { target, add, remove }
}

function click(target: EventTarget) {
  target.dispatchEvent(new Event('click'))
}

describe('useEventListener', () => {
  test('listens on the target until unmount', () => {
    const target = new EventTarget()
    const handler = vi.fn()
    const { unmount } = renderHook(() =>
      useEventListener(target, 'click', handler),
    )

    click(target)
    unmount()
    click(target)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('calls the handler of the latest render', () => {
    const target = new EventTarget()
    const seen: number[] = []
    const { rerender } = renderHook(
      ({ value }) => useEventListener(target, 'click', () => seen.push(value)),
      { initialProps: { value: 1 } },
    )

    click(target)
    rerender({ value: 2 })
    click(target)

    expect(seen).toEqual([1, 2])
  })

  test('an inline target and options do not re-attach on every render', () => {
    const { target, add, remove } = spyTarget()
    const { rerender } = renderHook(() =>
      useEventListener(
        () => target,
        'click',
        () => {},
        { passive: true },
      ),
    )

    rerender()
    rerender()

    expect(add).toHaveBeenCalledTimes(1)
    expect(remove).not.toHaveBeenCalled()
  })

  test('re-attaches when the target changes', () => {
    const first = new EventTarget()
    const second = new EventTarget()
    const handler = vi.fn()
    const { rerender } = renderHook(
      ({ target }: { target: UseEventListenerTarget }) =>
        useEventListener(target, 'click', handler),
      { initialProps: { target: first } },
    )

    rerender({ target: second })
    click(first)
    click(second)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('reads a function target after every render', () => {
    const first = new EventTarget()
    const second = new EventTarget()
    const ref: { current: EventTarget | null } = { current: first }
    const handler = vi.fn()
    const { rerender } = renderHook(() =>
      useEventListener(() => ref.current, 'click', handler),
    )

    ref.current = second
    rerender()
    click(first)
    click(second)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  test.each<[string, UseEventListenerTarget]>([
    ['null', null],
    ['a function that returns null', () => null],
  ])('listens on nothing when the target is %s', (_, target) => {
    const handler = vi.fn()
    renderHook(() => useEventListener(target, 'click', handler))

    click(document)

    expect(handler).not.toHaveBeenCalled()
  })

  test('re-attaches when an option changes', () => {
    const { target, add, remove } = spyTarget()
    const { rerender } = renderHook(
      ({ options }: { options: UseEventListenerOptions }) =>
        useEventListener(target, 'click', () => {}, options),
      {
        initialProps: {
          options: { capture: false } as UseEventListenerOptions,
        },
      },
    )

    // The same options written another way are not a change.
    rerender({ options: false })
    expect(add).toHaveBeenCalledTimes(1)

    rerender({ options: true })
    expect(remove).toHaveBeenCalledTimes(1)
    expect(add).toHaveBeenCalledTimes(2)
    expect(add).toHaveBeenLastCalledWith(
      'click',
      expect.any(Function),
      expect.objectContaining({ capture: true }),
    )
  })

  test('the disposer removes the listener, and a rerender does not bring it back', () => {
    const target = new EventTarget()
    const handler = vi.fn()
    const { result, rerender } = renderHook(() =>
      useEventListener(target, 'click', handler),
    )

    act(() => result.current())
    rerender()
    click(target)

    expect(handler).not.toHaveBeenCalled()
  })

  test('a new target after the disposer listens again', () => {
    const first = new EventTarget()
    const second = new EventTarget()
    const handler = vi.fn()
    const { result, rerender } = renderHook(
      ({ target }: { target: EventTarget }) =>
        useEventListener(target, 'click', handler),
      { initialProps: { target: first } },
    )

    act(() => result.current())
    rerender({ target: second })
    click(second)

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
