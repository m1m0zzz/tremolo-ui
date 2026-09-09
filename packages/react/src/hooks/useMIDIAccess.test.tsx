import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'

import { useMIDIAccess } from './useMIDIAccess'

function fakeAccess() {
  return {
    inputs: new Map(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MIDIAccess
}

function Subject() {
  const { midiAccess } = useMIDIAccess()
  return <output>{midiAccess ? 'connected' : 'pending'}</output>
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
})
