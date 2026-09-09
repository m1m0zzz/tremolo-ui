import { act, render, screen } from '@testing-library/react'

import { useLongPress } from './useLongPress'

function pointerEvent(type: string, pointerId = 1, button = 0) {
  const event = new MouseEvent(type, { bubbles: true, button })
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  return event
}

function Subject({ callback }: { callback: () => void }) {
  const press = useLongPress(callback, 100, 20)
  return (
    <button type="button" onPointerDown={press}>
      Press
    </button>
  )
}

function startPress() {
  act(() => {
    screen.getByRole('button').dispatchEvent(pointerEvent('pointerdown'))
  })
}

function startRepeating(callback: ReturnType<typeof vi.fn>) {
  startPress()
  act(() => vi.advanceTimersByTime(100))
  expect(callback).toHaveBeenCalledTimes(2)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useLongPress', () => {
  test('stops repeating on pointercancel', () => {
    const callback = vi.fn()
    render(<Subject callback={callback} />)
    startRepeating(callback)

    act(() => window.dispatchEvent(pointerEvent('pointercancel')))
    act(() => vi.advanceTimersByTime(200))

    expect(callback).toHaveBeenCalledTimes(2)
  })

  test('stops repeating when the window loses focus', () => {
    const callback = vi.fn()
    render(<Subject callback={callback} />)
    startRepeating(callback)

    act(() => window.dispatchEvent(new Event('blur')))
    act(() => vi.advanceTimersByTime(200))

    expect(callback).toHaveBeenCalledTimes(2)
  })

  test('stops repeating on pointerup', () => {
    const callback = vi.fn()
    render(<Subject callback={callback} />)
    startRepeating(callback)

    act(() => window.dispatchEvent(pointerEvent('pointerup')))
    act(() => vi.advanceTimersByTime(200))

    expect(callback).toHaveBeenCalledTimes(2)
  })

  test('only the primary button starts and the active pointer stops a press', () => {
    const callback = vi.fn()
    render(<Subject callback={callback} />)

    act(() => {
      screen
        .getByRole('button')
        .dispatchEvent(pointerEvent('pointerdown', 1, 1))
    })
    expect(callback).not.toHaveBeenCalled()

    startRepeating(callback)
    act(() => window.dispatchEvent(pointerEvent('pointerup', 2)))
    act(() => vi.advanceTimersByTime(40))
    expect(callback).toHaveBeenCalledTimes(4)

    act(() => window.dispatchEvent(pointerEvent('pointerup', 1)))
    act(() => vi.advanceTimersByTime(200))
    expect(callback).toHaveBeenCalledTimes(4)
  })
})
