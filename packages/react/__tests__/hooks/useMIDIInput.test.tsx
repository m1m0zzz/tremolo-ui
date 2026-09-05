import { act, render } from '@testing-library/react'
import { useState } from 'react'

import { useMIDIInput } from '../../src/hooks/useMIDIInput'

type FakeInput = {
  addEventListener: jest.Mock
  removeEventListener: jest.Mock
  send: (data: number[]) => void
}

function fakeInput(): FakeInput {
  const listeners = new Set<(event: unknown) => void>()
  return {
    addEventListener: jest.fn((type: string, fn: (event: unknown) => void) => {
      if (type === 'midimessage') listeners.add(fn)
    }),
    removeEventListener: jest.fn(
      (type: string, fn: (event: unknown) => void) => {
        if (type === 'midimessage') listeners.delete(fn)
      },
    ),
    send: (data) => {
      for (const listener of [...listeners]) {
        listener({ data: new Uint8Array(data) })
      }
    },
  }
}

function fakeAccess(input: FakeInput) {
  return {
    inputs: new Map([['0', input]]),
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MIDIAccess
}

describe('useMIDIInput', () => {
  test('a handler written inline stays attached across renders', () => {
    const input = fakeInput()
    const access = fakeAccess(input)
    const played: number[] = []

    function Subject() {
      const [tick, setTick] = useState(0)

      // Written inline, so it is a new function on every render — the case
      // that used to tear the listeners down and build them again.
      useMIDIInput(access, {
        onNoteOnEvent: (note) => played.push(note),
      })

      return (
        <button type="button" onClick={() => setTick(tick + 1)}>
          {tick}
        </button>
      )
    }

    const { getByRole } = render(<Subject />)

    act(() => getByRole('button').click())
    act(() => getByRole('button').click())

    expect(input.addEventListener).toHaveBeenCalledTimes(1)
    expect(input.removeEventListener).not.toHaveBeenCalled()

    input.send([0x90, 60, 100])
    expect(played).toEqual([60])
  })

  test('the newest handler is the one that runs', () => {
    const input = fakeInput()
    const access = fakeAccess(input)
    const seen: string[] = []

    function Subject({ label }: { label: string }) {
      useMIDIInput(access, { onNoteOnEvent: () => seen.push(label) })
      return null
    }

    const { rerender } = render(<Subject label="first" />)
    rerender(<Subject label="second" />)

    input.send([0x90, 60, 100])
    expect(seen).toEqual(['second'])
  })

  test('unmounting lets the device go', () => {
    const input = fakeInput()
    const { unmount } = render(<Harness access={fakeAccess(input)} />)

    unmount()

    expect(input.removeEventListener).toHaveBeenCalledWith(
      'midimessage',
      expect.any(Function),
    )
  })
})

function Harness({ access }: { access: MIDIAccess }) {
  useMIDIInput(access, { onNoteOnEvent: () => {} })
  return null
}
