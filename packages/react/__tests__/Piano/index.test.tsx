import { act, render, screen } from '@testing-library/react'
import { createRef } from 'react'

import { inScale, noteNumber } from '@tremolo-ui/functions'

import {
  Piano,
  PianoMethods,
  PianoProps,
  SHORTCUTS,
} from '../../src/components/Piano'

const range = { first: noteNumber('C3'), last: noteNumber('B4') }

/** One white key plus its gap, at the default width. */
const slot = 41
const height = 160

/** Deep enough to be below every black key. */
const WHITE = 150
/** Shallow enough to be inside a black key. */
const BLACK = 10

// jsdom has no PointerEvent and no pointer capture, so both are faked here.
function pointerEvent(
  type: string,
  init: { pointerId?: number; clientX?: number; clientY?: number } = {},
) {
  const { pointerId = 1, ...coords } = init
  const event = new MouseEvent(type, { bubbles: true })
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  for (const [key, value] of Object.entries(coords)) {
    Object.defineProperty(event, key, { value })
  }
  return event
}

function setup(props: Partial<PianoProps> = {}) {
  const onPlayNote = jest.fn()
  const onStopNote = jest.fn()
  const ref = createRef<PianoMethods>()

  const { container } = render(
    <Piano.Root
      ref={ref}
      noteRange={range}
      data-testid="piano"
      onPlayNote={onPlayNote}
      onStopNote={onStopNote}
      {...props}
    />,
  )

  const piano = screen.getByTestId('piano')
  Object.assign(piano, {
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    hasPointerCapture: () => true,
  })
  // jsdom lays nothing out, so the keyboard is placed by hand.
  piano.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 14 * slot, height }) as DOMRect

  return { container, piano, ref, onPlayNote, onStopNote }
}

const key = (note: number) =>
  document.querySelector(`[data-note='${note}']`) as HTMLElement

/** The x at the middle of the nth white key of the range. */
const whiteAt = (n: number) => n * slot + 20

describe('Piano', () => {
  test('draws a key per note, with the data attributes to select on', () => {
    setup()

    // Two octaves, C3..B4.
    expect(document.querySelectorAll('[data-note]')).toHaveLength(24)
    expect(key(noteNumber('C3')).className).toBe('tremolo-piano-white-key')
    expect(key(noteNumber('C3')).getAttribute('data-note-key')).toBe('C')
    expect(key(noteNumber('C#3')).className).toBe('tremolo-piano-black-key')
    expect(key(noteNumber('C#3')).getAttribute('data-note-key')).toBe('C#')
  })

  test('a pointer plays the note it lands on, with no key components', () => {
    const { piano, onPlayNote, onStopNote } = setup()

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
      )
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
    expect(key(noteNumber('C3')).getAttribute('data-active')).toBe('true')

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerup', { clientX: whiteAt(0), clientY: WHITE }),
      )
    })
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
    expect(key(noteNumber('C3')).getAttribute('data-active')).toBe('false')
  })

  test('a black key wins where it overlaps a white one', () => {
    const { piano, onPlayNote } = setup()

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerdown', { clientX: slot - 5, clientY: BLACK }),
      )
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C#3'), undefined)
  })

  test('several pointers light several keys', () => {
    const { piano } = setup()

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerdown', {
          pointerId: 1,
          clientX: whiteAt(0),
          clientY: WHITE,
        }),
      )
      piano.dispatchEvent(
        pointerEvent('pointerdown', {
          pointerId: 2,
          clientX: whiteAt(4),
          clientY: WHITE,
        }),
      )
    })

    expect(key(noteNumber('C3')).getAttribute('data-active')).toBe('true')
    expect(key(noteNumber('G3')).getAttribute('data-active')).toBe('true')
    expect(key(noteNumber('D3')).getAttribute('data-active')).toBe('false')
  })

  test('keyboard shortcuts play notes', () => {
    const { onPlayNote, onStopNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
    expect(key(noteNumber('C3')).getAttribute('data-active')).toBe('true')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))
    })
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
  })

  test('HOME_ROW_NATURAL leaves the black keys silent', () => {
    const { onPlayNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW_NATURAL,
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('D3'), undefined)

    // The entries the black keys would use are empty strings, which no
    // KeyboardEvent.key can be.
    onPlayNote.mockClear()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '' }))
    })
    expect(onPlayNote).not.toHaveBeenCalled()
  })

  test('playNote from the ref lights the key and calls back', () => {
    const { ref, onPlayNote, onStopNote } = setup()

    act(() => ref.current?.playNote(noteNumber('E3'), 0.8))
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('E3'), 0.8)
    expect(key(noteNumber('E3')).getAttribute('data-active')).toBe('true')

    act(() => ref.current?.stopNote(noteNumber('E3')))
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('E3'))
  })

  test('a pointer and the ref holding one note stop it only once', () => {
    const { piano, ref, onPlayNote, onStopNote } = setup()

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
      )
    })
    act(() => ref.current?.playNote(noteNumber('C3')))
    expect(onPlayNote).toHaveBeenCalledTimes(1)

    act(() => ref.current?.stopNote(noteNumber('C3')))
    expect(onStopNote).not.toHaveBeenCalled()
    expect(key(noteNumber('C3')).getAttribute('data-active')).toBe('true')

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerup', { clientX: whiteAt(0), clientY: WHITE }),
      )
    })
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
  })

  test('midiMax disables the keys above it', () => {
    const { onPlayNote, ref } = setup({ midiMax: noteNumber('C4') })

    expect(key(noteNumber('C4')).getAttribute('aria-disabled')).toBe('false')
    expect(key(noteNumber('C#4')).getAttribute('aria-disabled')).toBe('true')

    act(() => ref.current?.playNote(noteNumber('C#4')))
    expect(onPlayNote).not.toHaveBeenCalled()
  })

  test('label draws nothing for an empty, null or undefined result', () => {
    setup({
      label: (note) =>
        ({
          [noteNumber('C3')]: 'C',
          [noteNumber('C#3')]: '',
          [noteNumber('D3')]: null,
        })[note],
    })

    expect(key(noteNumber('C3')).textContent).toBe('C')
    expect(
      key(noteNumber('C#3')).querySelector('.tremolo-piano-key-label'),
    ).toBe(null)
    expect(
      key(noteNumber('D3')).querySelector('.tremolo-piano-key-label'),
    ).toBe(null)
    // Not covered by the range object above, so undefined.
    expect(
      key(noteNumber('E3')).querySelector('.tremolo-piano-key-label'),
    ).toBe(null)
  })

  test('label keeps 0', () => {
    setup({ label: (note) => (note === noteNumber('C3') ? 0 : undefined) })
    expect(key(noteNumber('C3')).textContent).toBe('0')
  })

  test('keyProps decorates a key without a component per key', () => {
    const root = noteNumber('D3')
    setup({
      keyProps: (note) => ({
        'data-in-scale': inScale(note, root, 'major'),
      }),
    })

    expect(key(noteNumber('D3')).getAttribute('data-in-scale')).toBe('true')
    expect(key(noteNumber('F#3')).getAttribute('data-in-scale')).toBe('true')
    expect(key(noteNumber('F3')).getAttribute('data-in-scale')).toBe('false')
    // Octave independent.
    expect(key(noteNumber('F#4')).getAttribute('data-in-scale')).toBe('true')
  })

  test('keyProps cannot move a key away from where it responds', () => {
    const { piano, onPlayNote } = setup({
      keyProps: () => ({
        className: 'mine',
        style: { left: 999, width: 5, '--bg': 'red' },
      }),
    })

    const c3 = key(noteNumber('C3'))
    expect(c3.className).toBe('tremolo-piano-white-key mine')
    // The custom property survives; the geometry is the layout's.
    expect(c3.style.getPropertyValue('--bg')).toBe('red')
    expect(c3.style.left).toBe('0px')
    expect(c3.style.width).toBe('40px')

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerdown', { clientX: whiteAt(0), clientY: WHITE }),
      )
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
  })

  test('the geometry props drive both the drawing and the hit testing', () => {
    const { piano, onPlayNote } = setup({ whiteKeyWidth: 19, keyGap: 1 })

    expect(key(noteNumber('D3')).style.left).toBe('20px')
    expect(key(noteNumber('D3')).style.width).toBe('19px')

    act(() => {
      piano.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 25, clientY: WHITE }),
      )
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('D3'), undefined)
  })
})
