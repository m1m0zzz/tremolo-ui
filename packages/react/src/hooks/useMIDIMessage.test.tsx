import { render } from '@testing-library/react'

import { useMIDIMessage } from './useMIDIMessage'

function fakeInput() {
  return new EventTarget() as unknown as MIDIInput
}

function fakeAccess(input: MIDIInput) {
  const target = new EventTarget()
  return Object.assign(target, {
    inputs: new Map([['input', input]]),
  }) as unknown as MIDIAccess
}

function Subject({
  access,
  handler,
}: {
  access: MIDIAccess | null
  handler: (event: MIDIMessageEvent) => void
}) {
  useMIDIMessage(access, handler)
  return null
}

const message = () => new Event('midimessage') as MIDIMessageEvent

describe('useMIDIMessage', () => {
  test('uses the latest handler without rebuilding its listeners', () => {
    const input = fakeInput()
    const access = fakeAccess(input)
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Subject access={access} handler={first} />)

    input.dispatchEvent(message())
    rerender(<Subject access={access} handler={second} />)
    input.dispatchEvent(message())

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  test('moves listeners when access changes and removes them on unmount', () => {
    const firstInput = fakeInput()
    const secondInput = fakeInput()
    const firstAccess = fakeAccess(firstInput)
    const secondAccess = fakeAccess(secondInput)
    const handler = vi.fn()
    const { rerender, unmount } = render(
      <Subject access={firstAccess} handler={handler} />,
    )

    rerender(<Subject access={secondAccess} handler={handler} />)
    firstInput.dispatchEvent(message())
    secondInput.dispatchEvent(message())
    expect(handler).toHaveBeenCalledTimes(1)

    unmount()
    secondInput.dispatchEvent(message())
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
