import {
  createMIDIInput,
  PITCH_BEND_CENTER,
  type MIDIInputHandlers,
} from '../../src/midi/input'

function setup(handlers: MIDIInputHandlers) {
  let listener!: (event: MIDIMessageEvent) => void
  const access = {
    inputs: new Map([
      [
        '0',
        {
          addEventListener: (
            type: string,
            fn: (e: MIDIMessageEvent) => void,
          ) => {
            if (type === 'midimessage') listener = fn
          },
          removeEventListener: () => {},
        },
      ],
    ]),
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MIDIAccess

  const instance = createMIDIInput(access, handlers)

  return {
    instance,
    send: (...data: number[]) =>
      listener({ data: new Uint8Array(data) } as MIDIMessageEvent),
  }
}

describe('createMIDIInput', () => {
  test('note on', () => {
    const onNoteOnEvent = jest.fn()
    const { send } = setup({ onNoteOnEvent })
    send(0x90, 60, 100)
    expect(onNoteOnEvent).toHaveBeenCalledWith(60, 100, 0)
  })

  test('note off', () => {
    const onNoteOffEvent = jest.fn()
    const { send } = setup({ onNoteOffEvent })
    send(0x80, 60, 0)
    expect(onNoteOffEvent).toHaveBeenCalledWith(60, 0)
  })

  test('note on with velocity 0 is treated as note off', () => {
    const onNoteOnEvent = jest.fn()
    const onNoteOffEvent = jest.fn()
    const { send } = setup({ onNoteOnEvent, onNoteOffEvent })
    send(0x90, 60, 0)
    expect(onNoteOffEvent).toHaveBeenCalledWith(60, 0)
    expect(onNoteOnEvent).not.toHaveBeenCalled()
  })

  test('the channel nibble is reported, not discarded', () => {
    const onNoteOnEvent = jest.fn()
    const { send } = setup({ onNoteOnEvent })
    send(0x9f, 60, 100)
    // 0x9f is note on, channel 16 as printed on hardware.
    expect(onNoteOnEvent).toHaveBeenCalledWith(60, 100, 15)
  })

  test('pitch bend is one 14-bit value, low byte first', () => {
    const onPitchBendEvent = jest.fn()
    const { send } = setup({ onPitchBendEvent })

    // The wheel at rest.
    send(0xe0, 0x00, 0x40)
    expect(onPitchBendEvent).toHaveBeenLastCalledWith(PITCH_BEND_CENTER, 0)

    send(0xe0, 0x00, 0x00)
    expect(onPitchBendEvent).toHaveBeenLastCalledWith(0, 0)

    send(0xe0, 0x7f, 0x7f)
    expect(onPitchBendEvent).toHaveBeenLastCalledWith(16383, 0)

    // Low byte alone: one step above centre.
    send(0xe1, 0x01, 0x40)
    expect(onPitchBendEvent).toHaveBeenLastCalledWith(PITCH_BEND_CENTER + 1, 1)
  })

  test('control change', () => {
    const onControlChangeEvent = jest.fn()
    const { send } = setup({ onControlChangeEvent })
    send(0xb2, 7, 100)
    expect(onControlChangeEvent).toHaveBeenCalledWith(7, 100, 2)
  })

  test('program change carries one data byte', () => {
    const onProgramChangeEvent = jest.fn()
    const { send } = setup({ onProgramChangeEvent })
    send(0xc0, 42)
    expect(onProgramChangeEvent).toHaveBeenCalledWith(42, 0)
  })

  test('polyphonic aftertouch', () => {
    const onAftertouchEvent = jest.fn()
    const { send } = setup({ onAftertouchEvent })
    send(0xa0, 60, 80)
    expect(onAftertouchEvent).toHaveBeenCalledWith(60, 80, 0)
  })

  test('channel pressure', () => {
    const onChannelPressureEvent = jest.fn()
    const { send } = setup({ onChannelPressureEvent })
    send(0xd0, 90)
    expect(onChannelPressureEvent).toHaveBeenCalledWith(90, 0)
  })

  test('system messages carry no channel and are left alone', () => {
    const handlers = {
      onNoteOnEvent: jest.fn(),
      onNoteOffEvent: jest.fn(),
      onControlChangeEvent: jest.fn(),
      onProgramChangeEvent: jest.fn(),
      onChannelPressureEvent: jest.fn(),
      onPitchBendEvent: jest.fn(),
      onAftertouchEvent: jest.fn(),
    }
    const { send } = setup(handlers)

    send(0xf8) // timing clock
    send(0xfe) // active sensing
    send(0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7) // an identity request

    for (const handler of Object.values(handlers)) {
      expect(handler).not.toHaveBeenCalled()
    }
  })

  test('an empty message is ignored', () => {
    const onNoteOnEvent = jest.fn()
    const { send } = setup({ onNoteOnEvent })
    expect(() => send()).not.toThrow()
    expect(onNoteOnEvent).not.toHaveBeenCalled()
  })

  test('update replaces the handlers', () => {
    const first = jest.fn()
    const second = jest.fn()
    const { instance, send } = setup({ onNoteOnEvent: first })

    instance.update({ onNoteOnEvent: second })
    send(0x90, 60, 100)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(60, 100, 0)
  })

  test('a null access is a no-op', () => {
    const instance = createMIDIInput(null, { onNoteOnEvent: jest.fn() })
    expect(() => instance.destroy()).not.toThrow()
  })
})
