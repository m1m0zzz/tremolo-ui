import { createMIDIMessage } from '../../src/midi/message'

type FakeInput = {
  addEventListener: jest.Mock
  removeEventListener: jest.Mock
}

function fakeInput(): FakeInput {
  return { addEventListener: jest.fn(), removeEventListener: jest.fn() }
}

function fakeAccess(...inputs: FakeInput[]) {
  return {
    inputs: new Map(inputs.map((input, i) => [String(i), input])),
  } as unknown as MIDIAccess
}

describe('createMIDIMessage', () => {
  test('subscribes to every input and unsubscribes on destroy', () => {
    const a = fakeInput()
    const b = fakeInput()
    const onMIDIMessage = jest.fn()

    const instance = createMIDIMessage(fakeAccess(a, b), onMIDIMessage)

    expect(a.addEventListener).toHaveBeenCalledWith(
      'midimessage',
      onMIDIMessage,
    )
    expect(b.addEventListener).toHaveBeenCalledWith(
      'midimessage',
      onMIDIMessage,
    )

    instance.destroy()

    expect(a.removeEventListener).toHaveBeenCalledWith(
      'midimessage',
      onMIDIMessage,
    )
    expect(b.removeEventListener).toHaveBeenCalledWith(
      'midimessage',
      onMIDIMessage,
    )
  })

  test('a null access is a no-op', () => {
    const instance = createMIDIMessage(null, jest.fn())
    expect(() => instance.destroy()).not.toThrow()
  })
})
