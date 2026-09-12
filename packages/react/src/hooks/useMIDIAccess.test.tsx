import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'

import { useMIDIAccess } from './useMIDIAccess'

function fakeAccess() {
  const target = new EventTarget()
  return Object.assign(target, {
    inputs: new Map<string, MIDIInput>(),
    addEventListener: vi.fn(target.addEventListener.bind(target)),
    removeEventListener: vi.fn(target.removeEventListener.bind(target)),
  }) as unknown as MIDIAccess & { inputs: Map<string, MIDIInput> }
}

function Subject({ requestOnMount = true }: { requestOnMount?: boolean }) {
  const { request, midiAccess, inputs, error } = useMIDIAccess(requestOnMount)
  return (
    <>
      <button type="button" onClick={() => request()}>
        request
      </button>
      <output>{midiAccess ? 'connected' : 'pending'}</output>
      <output data-testid="inputs">{inputs.length}</output>
      <output data-testid="error">{error ?? 'none'}</output>
    </>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMIDIAccess', () => {
  test('gets MIDI access in StrictMode and destroys it on unmount', async () => {
    const firstAccess = fakeAccess()
    const activeAccess = fakeAccess()
    const requestMIDIAccess = vi
      .fn()
      .mockResolvedValueOnce(firstAccess)
      .mockResolvedValueOnce(activeAccess)
    vi.stubGlobal('navigator', { requestMIDIAccess })

    const { unmount } = render(
      <StrictMode>
        <Subject />
      </StrictMode>,
    )

    expect(await screen.findByText('connected')).toBeInTheDocument()
    expect(requestMIDIAccess).toHaveBeenCalledTimes(2)
    expect(activeAccess.addEventListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function),
    )

    unmount()

    expect(activeAccess.removeEventListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function),
    )
  })

  test('does not request on mount when requestOnMount is false', () => {
    const requestMIDIAccess = vi.fn().mockResolvedValue(fakeAccess())
    vi.stubGlobal('navigator', { requestMIDIAccess })
    render(<Subject requestOnMount={false} />)

    expect(requestMIDIAccess).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'request' }))
    expect(requestMIDIAccess).toHaveBeenCalledTimes(1)
  })

  test('re-renders for input and error state changes', async () => {
    const access = fakeAccess()
    access.inputs.set('first', { id: 'first' } as MIDIInput)
    const requestMIDIAccess = vi
      .fn()
      .mockResolvedValueOnce(access)
      .mockRejectedValueOnce(new DOMException('denied', 'SecurityError'))
    vi.stubGlobal('navigator', { requestMIDIAccess })
    render(<Subject />)

    expect(await screen.findByTestId('inputs')).toHaveTextContent('1')

    access.inputs.set('second', { id: 'second' } as MIDIInput)
    act(() => access.dispatchEvent(new Event('statechange')))
    expect(screen.getByTestId('inputs')).toHaveTextContent('2')

    fireEvent.click(screen.getByRole('button', { name: 'request' }))
    expect(await screen.findByTestId('error')).toHaveTextContent(
      'PERMISSION_DENIED',
    )
  })
})
