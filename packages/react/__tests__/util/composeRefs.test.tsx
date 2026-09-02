import { act, render } from '@testing-library/react'
import { useCallback, useRef, useState } from 'react'

import { useComposedRefs } from '../../src/components/_util/composeRefs'

/**
 * A composed ref must stay identical across renders. React detaches and
 * re-attaches whenever the ref callback changes identity, which breaks any
 * ref callback that acquires a resource.
 */
function Subject({
  onAttach,
}: {
  onAttach: (node: HTMLDivElement | null) => void
}) {
  const [, setTick] = useState(0)
  const objectRef = useRef<HTMLDivElement>(null)
  const callbackRef = useCallback(onAttach, [onAttach])

  const ref = useComposedRefs<HTMLDivElement>(objectRef, callbackRef)

  return (
    <div data-testid="target" ref={ref}>
      <button type="button" onClick={() => setTick((t) => t + 1)}>
        re-render
      </button>
    </div>
  )
}

describe('useComposedRefs', () => {
  test('attaches once and survives re-renders', () => {
    const onAttach = jest.fn()
    const { getByTestId, rerender } = render(<Subject onAttach={onAttach} />)

    expect(onAttach).toHaveBeenCalledTimes(1)
    expect(onAttach.mock.calls[0][0]).toBe(getByTestId('target'))

    rerender(<Subject onAttach={onAttach} />)
    act(() => {
      getByTestId('target').querySelector('button')?.click()
    })

    // No detach (null) and no re-attach.
    expect(onAttach).toHaveBeenCalledTimes(1)
  })

  test('sets both an object ref and a callback ref', () => {
    let seen: HTMLDivElement | null = null
    const { getByTestId } = render(<Subject onAttach={(n) => (seen = n)} />)
    expect(seen).toBe(getByTestId('target'))
  })

  test('detaches on unmount', () => {
    const onAttach = jest.fn()
    const { unmount } = render(<Subject onAttach={onAttach} />)
    unmount()
    expect(onAttach).toHaveBeenLastCalledWith(null)
  })
})
