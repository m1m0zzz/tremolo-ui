import { createMIDIInput, type MIDIInputHandlers } from '../../src/midi/input'

function setup(handlers: MIDIInputHandlers) {
  let listener!: (event: MIDIMessageEvent) => void
  const access = {
    inputs: new Map([
      [
        '0',
        {
          addEventListener: (_: string, fn: (e: MIDIMessageEvent) => void) => {
            listener = fn
          },
          removeEventListener: () => {},
        },
      ],
    ]),
  } as unknown as MIDIAccess

  createMIDIInput(access, handlers)

  return (...data: number[]) =>
    listener({ data: new Uint8Array(data) } as MIDIMessageEvent)
}

describe('createMIDIInput', () => {
  test('note on', () => {
    const onNoteOnEvent = jest.fn()
    const send = setup({ onNoteOnEvent })
    send(0x90, 60, 100)
    expect(onNoteOnEvent).toHaveBeenCalledWith(60, 100)
  })

  test('note off', () => {
    const onNoteOffEvent = jest.fn()
    const send = setup({ onNoteOffEvent })
    send(0x80, 60, 0)
    expect(onNoteOffEvent).toHaveBeenCalledWith(60)
  })

  test('note on with velocity 0 is treated as note off', () => {
    const onNoteOnEvent = jest.fn()
    const onNoteOffEvent = jest.fn()
    const send = setup({ onNoteOnEvent, onNoteOffEvent })
    send(0x90, 60, 0)
    expect(onNoteOffEvent).toHaveBeenCalledWith(60)
    expect(onNoteOnEvent).not.toHaveBeenCalled()
  })

  test('the channel nibble is ignored', () => {
    const onNoteOnEvent = jest.fn()
    const send = setup({ onNoteOnEvent })
    send(0x9f, 60, 100)
    expect(onNoteOnEvent).toHaveBeenCalledWith(60, 100)
  })

  test('pitch bend', () => {
    const onPitchBendEvent = jest.fn()
    const send = setup({ onPitchBendEvent })
    send(0xe0, 0x00, 0x40)
    expect(onPitchBendEvent).toHaveBeenCalledWith(0x00, 0x40)
  })

  test('other messages are ignored', () => {
    const onNoteOnEvent = jest.fn()
    const onNoteOffEvent = jest.fn()
    const onPitchBendEvent = jest.fn()
    const send = setup({ onNoteOnEvent, onNoteOffEvent, onPitchBendEvent })
    send(0xb0, 7, 100) // control change
    expect(onNoteOnEvent).not.toHaveBeenCalled()
    expect(onNoteOffEvent).not.toHaveBeenCalled()
    expect(onPitchBendEvent).not.toHaveBeenCalled()
  })
})
