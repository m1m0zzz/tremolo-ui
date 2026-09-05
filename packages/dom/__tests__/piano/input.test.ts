import { noteNumber, type PianoLayout } from '@tremolo-ui/functions'

import { createPianoInput } from '../../src/piano/input'
import { pointerEvent, withPointerCapture } from '../pointer/helpers'

const layout: PianoLayout = {
  noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
  whiteKeyWidth: 40,
}

/** One white key plus its gap. */
const slot = 41
const height = 160

/** Deep enough to be below every black key. */
const WHITE = 150
/** Shallow enough to be inside a black key. */
const BLACK = 10

const instances: { destroy: () => void }[] = []

function setup(options: Partial<Parameters<typeof createPianoInput>[1]> = {}) {
  const element = document.createElement('div')
  document.body.appendChild(element)
  withPointerCapture(element)
  // jsdom lays nothing out, so the keyboard is placed by hand.
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 14 * slot, height }) as DOMRect

  const onPlayNote = jest.fn()
  const onStopNote = jest.fn()
  const onActiveNotesChange = jest.fn()

  const instance = createPianoInput(element, {
    layout,
    onPlayNote,
    onStopNote,
    onActiveNotesChange,
    ...options,
  })
  instances.push(instance)

  return { element, instance, onPlayNote, onStopNote, onActiveNotesChange }
}

/** The x at the middle of the nth white key of the range. */
const whiteAt = (n: number) => n * slot + 20

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy()
  document.body.innerHTML = ''
})

describe('createPianoInput', () => {
  test('plays the note under the pointer on pointerdown', () => {
    const { element, onPlayNote, onActiveNotesChange } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )

    expect(onPlayNote).toHaveBeenCalledTimes(1)
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
    expect(onActiveNotesChange).toHaveBeenLastCalledWith([noteNumber('C3')])
  })

  test('stops the note on pointerup', () => {
    const { element, onStopNote, onActiveNotesChange } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )
    element.dispatchEvent(
      pointerEvent('pointerup', { clientX: whiteAt(0), clientY: WHITE }),
    )

    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
    expect(onActiveNotesChange).toHaveBeenLastCalledWith([])
  })

  test('reaches the black keys', () => {
    const { element, onPlayNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: slot - 5, clientY: BLACK }),
    )
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C#3'), undefined)
  })

  test('glissando moves the note as the pointer slides', () => {
    const { element, instance, onPlayNote, onStopNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: whiteAt(1), clientY: WHITE }),
    )

    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
    expect(onPlayNote).toHaveBeenLastCalledWith(noteNumber('D3'), undefined)
    expect(instance.activeNotes()).toEqual([noteNumber('D3')])
  })

  test('staying on the same key does not retrigger', () => {
    const { element, onPlayNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: whiteAt(0) + 5, clientY: WHITE }),
    )
    expect(onPlayNote).toHaveBeenCalledTimes(1)
  })

  test('glissando off holds the key that was pressed', () => {
    const { element, instance, onPlayNote, onStopNote } = setup({
      glissando: false,
    })

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: whiteAt(3), clientY: WHITE }),
    )

    expect(onPlayNote).toHaveBeenCalledTimes(1)
    expect(onStopNote).not.toHaveBeenCalled()
    expect(instance.activeNotes()).toEqual([noteNumber('C3')])
  })

  test('sliding off the keyboard stops the note', () => {
    const { element, instance, onStopNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: whiteAt(0), clientY: -50 }),
    )

    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
    expect(instance.activeNotes()).toEqual([])
  })

  test('several pointers play a chord', () => {
    const { element, instance, onPlayNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 1,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )
    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 2,
        clientX: whiteAt(2),
        clientY: WHITE,
      }),
    )
    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 3,
        clientX: whiteAt(4),
        clientY: WHITE,
      }),
    )

    expect(onPlayNote).toHaveBeenCalledTimes(3)
    expect(instance.activeNotes()).toEqual([
      noteNumber('C3'),
      noteNumber('E3'),
      noteNumber('G3'),
    ])
  })

  test('one finger lifting leaves the rest of the chord sounding', () => {
    const { element, instance, onStopNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 1,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )
    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 2,
        clientX: whiteAt(2),
        clientY: WHITE,
      }),
    )
    element.dispatchEvent(
      pointerEvent('pointerup', {
        pointerId: 1,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )

    expect(onStopNote).toHaveBeenCalledTimes(1)
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
    expect(instance.activeNotes()).toEqual([noteNumber('E3')])
  })

  test('a note held by two pointers stops only once both let go', () => {
    const { element, instance, onPlayNote, onStopNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 1,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )
    // A second finger glides onto the key the first one is holding.
    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 2,
        clientX: whiteAt(1),
        clientY: WHITE,
      }),
    )
    element.dispatchEvent(
      pointerEvent('pointermove', {
        pointerId: 2,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )
    // C3 was already sounding, so it is not played again.
    expect(onPlayNote).toHaveBeenCalledTimes(2)
    expect(instance.activeNotes()).toEqual([noteNumber('C3')])

    onStopNote.mockClear()
    element.dispatchEvent(
      pointerEvent('pointerup', {
        pointerId: 1,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )
    expect(onStopNote).not.toHaveBeenCalled()
    expect(instance.activeNotes()).toEqual([noteNumber('C3')])

    element.dispatchEvent(
      pointerEvent('pointerup', {
        pointerId: 2,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
    expect(instance.activeNotes()).toEqual([])
  })

  test('noteOn and noteOff work without a pointer', () => {
    const { instance, onPlayNote, onStopNote } = setup()

    instance.noteOn(60, { source: 'midi', velocity: 0.8 })
    expect(onPlayNote).toHaveBeenCalledWith(60, 0.8)
    expect(instance.activeNotes()).toEqual([60])

    instance.noteOff(60, { source: 'midi' })
    expect(onStopNote).toHaveBeenCalledWith(60)
    expect(instance.activeNotes()).toEqual([])
  })

  test('a pointer and MIDI holding one note count separately', () => {
    const { element, instance, onPlayNote, onStopNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )
    instance.noteOn(noteNumber('C3'), { source: 'midi' })
    expect(onPlayNote).toHaveBeenCalledTimes(1)

    instance.noteOff(noteNumber('C3'), { source: 'midi' })
    expect(onStopNote).not.toHaveBeenCalled()

    element.dispatchEvent(
      pointerEvent('pointerup', { clientX: whiteAt(0), clientY: WHITE }),
    )
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
  })

  test('noteOff for a note that is not sounding does nothing', () => {
    const { instance, onStopNote } = setup()
    instance.noteOff(60)
    expect(onStopNote).not.toHaveBeenCalled()
  })

  test('midiMax refuses a note, whichever source asks', () => {
    const { element, instance, onPlayNote } = setup({
      midiMax: noteNumber('C4'),
    })

    instance.noteOn(noteNumber('C#4'))
    expect(onPlayNote).not.toHaveBeenCalled()

    // The 8th white key of C3..B4 is C4, the last one allowed.
    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(7), clientY: WHITE }),
    )
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C4'), undefined)

    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: whiteAt(8), clientY: WHITE }),
    )
    expect(instance.activeNotes()).toEqual([])
  })

  test('update replaces the layout without ending a drag', () => {
    const { element, instance, onPlayNote } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
    )
    // Half as wide: slots of 20px, so x = 102 is the 6th white key rather
    // than the 3rd.
    instance.update({ layout: { ...layout, whiteKeyWidth: 19 } })
    element.dispatchEvent(
      pointerEvent('pointermove', { clientX: whiteAt(2), clientY: WHITE }),
    )

    expect(onPlayNote).toHaveBeenLastCalledWith(noteNumber('A3'), undefined)
  })

  test('destroy releases everything still held', () => {
    const { element, instance, onStopNote, onActiveNotesChange } = setup()

    element.dispatchEvent(
      pointerEvent('pointerdown', {
        pointerId: 1,
        clientX: whiteAt(0),
        clientY: WHITE,
      }),
    )
    instance.noteOn(90, { source: 'midi' })

    onStopNote.mockClear()
    instance.destroy()

    expect(onStopNote.mock.calls.map(([note]) => note)).toEqual([
      noteNumber('C3'),
      90,
    ])
    expect(onActiveNotesChange).toHaveBeenLastCalledWith([])
    expect(instance.activeNotes()).toEqual([])
  })
})
