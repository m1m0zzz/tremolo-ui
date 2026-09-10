import { act, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'

import { inScale, noteNumber } from '@tremolo-ui/functions'

import { Piano, PianoMethods, PianoProps, SHORTCUTS } from '.'

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
  const onPlayNote = vi.fn()
  const onStopNote = vi.fn()
  const ref = createRef<PianoMethods>()

  const rendered = render(
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

  const rerender = (nextProps: Partial<PianoProps>) =>
    rendered.rerender(
      <Piano.Root
        ref={ref}
        noteRange={range}
        data-testid="piano"
        onPlayNote={onPlayNote}
        onStopNote={onStopNote}
        {...props}
        {...nextProps}
      />,
    )

  return { ...rendered, piano, ref, onPlayNote, onStopNote, rerender }
}

const key = (note: number) =>
  document.querySelector(`[data-note='${note}']`) as HTMLElement

/** The x at the middle of the nth white key of the range. */
const whiteAt = (n: number) => n * slot + 20

function dispatchKey(
  target: EventTarget,
  type: 'keydown' | 'keyup',
  key: string,
) {
  target.dispatchEvent(new KeyboardEvent(type, { bubbles: true, key }))
}

function stubResizeObserver() {
  const observers: Array<{
    callback: ResizeObserverCallback
    observe: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }> = []

  class FakeResizeObserver {
    observe = vi.fn()
    disconnect = vi.fn()

    constructor(public callback: ResizeObserverCallback) {
      observers.push(this)
    }
  }

  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  return observers
}

afterEach(() => vi.unstubAllGlobals())

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
    const { piano, onPlayNote, onStopNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })

    expect(piano).toHaveAttribute('role', 'group')
    expect(piano).toHaveAttribute('tabindex', '0')

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 'a')
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
    expect(key(noteNumber('C3')).getAttribute('data-active')).toBe('true')

    act(() => {
      dispatchKey(piano, 'keyup', 'a')
    })
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
  })

  test('stops the played note when noteRange changes while a key is down', () => {
    const { piano, onStopNote, rerender } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 'a')
    })

    rerender({
      noteRange: { first: noteNumber('C4'), last: noteNumber('B5') },
    })
    expect(onStopNote).toHaveBeenCalledTimes(1)
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))

    act(() => dispatchKey(piano, 'keyup', 'a'))
    expect(onStopNote).toHaveBeenCalledTimes(1)
  })

  test('stops played notes when keyboardShortcuts is removed', () => {
    const { piano, onStopNote, rerender } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 'a')
    })
    rerender({ keyboardShortcuts: undefined })

    expect(onStopNote).toHaveBeenCalledTimes(1)
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
  })

  test('stops every shortcut note when the window loses focus', () => {
    const { piano, onStopNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 'a')
      dispatchKey(piano, 'keydown', 's')
      window.dispatchEvent(new Event('blur'))
    })

    expect(onStopNote.mock.calls.map(([note]) => note)).toEqual([
      noteNumber('C3'),
      noteNumber('D3'),
    ])
  })

  test('stops every shortcut note when unmounted', () => {
    const { piano, onStopNote, unmount } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 'a')
    })
    unmount()

    expect(onStopNote).toHaveBeenCalledTimes(1)
    expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
  })

  test('does not play shortcuts beyond noteRange.last', () => {
    const { piano, onPlayNote } = setup({
      noteRange: { first: noteNumber('C3'), last: noteNumber('C3') },
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 'w')
    })
    expect(onPlayNote).not.toHaveBeenCalled()
  })

  test('does not play window shortcuts from an input', () => {
    const { onPlayNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
      keyboardShortcutsScope: 'window',
    })
    const input = document.createElement('input')
    document.body.appendChild(input)

    act(() => {
      input.focus()
      dispatchKey(input, 'keydown', 'a')
    })
    expect(onPlayNote).not.toHaveBeenCalled()
  })

  test('listens only within the focused root by default', () => {
    const { piano, onPlayNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    act(() => {
      outside.focus()
      dispatchKey(outside, 'keydown', 'a')
    })
    expect(onPlayNote).not.toHaveBeenCalled()

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 'a')
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
  })

  test('can listen for shortcuts on the window', () => {
    const { onPlayNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
      keyboardShortcutsScope: 'window',
    })
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    act(() => {
      outside.focus()
      dispatchKey(outside, 'keydown', 'a')
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
  })

  test('HOME_ROW_NATURAL leaves the black keys silent', () => {
    const { piano, onPlayNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW_NATURAL,
    })

    act(() => {
      piano.focus()
      dispatchKey(piano, 'keydown', 's')
    })
    expect(onPlayNote).toHaveBeenCalledWith(noteNumber('D3'), undefined)

    // `w` is a real key, but HOME_ROW_NATURAL deliberately leaves it
    // unassigned where the black key would otherwise be.
    onPlayNote.mockClear()
    act(() => {
      dispatchKey(piano, 'keydown', 'w')
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

  test('fill observes the parent and recalculates width when keyGap changes', () => {
    const observers = stubResizeObserver()
    const { piano, rerender, unmount } = setup({ fill: true, keyGap: 2 })
    Object.defineProperty(piano, 'clientWidth', {
      configurable: true,
      value: 280,
    })

    act(() =>
      observers[0].callback([], observers[0] as unknown as ResizeObserver),
    )
    expect(Number.parseFloat(key(noteNumber('C3')).style.width)).toBeCloseTo(18)

    rerender({ fill: true, keyGap: 4 })
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
    act(() =>
      observers[1].callback([], observers[1] as unknown as ResizeObserver),
    )
    expect(Number.parseFloat(key(noteNumber('C3')).style.width)).toBeCloseTo(16)

    unmount()
    expect(observers[1].disconnect).toHaveBeenCalledTimes(1)
  })

  test('fill keeps a black-key-only range finite', () => {
    const observers = stubResizeObserver()
    const black = noteNumber('C#3')
    const { piano } = setup({
      fill: true,
      noteRange: { first: black, last: black },
    })
    Object.defineProperty(piano, 'clientWidth', { value: 100 })

    act(() =>
      observers[0].callback([], observers[0] as unknown as ResizeObserver),
    )

    expect(Number.isFinite(Number.parseFloat(key(black).style.width))).toBe(
      true,
    )
  })

  test('keeps a held note when the caller passes the keys inline', () => {
    const onPlayNote = vi.fn()
    const onStopNote = vi.fn()

    function Subject() {
      const [count, setCount] = useState(0)
      return (
        <>
          <button onClick={() => setCount((c) => c + 1)}>rerender</button>
          <span>{count}</span>
          {/* A literal hands over a new array on every render. */}
          <Piano.Root
            noteRange={{ first: 60, last: 72 }}
            keyboardShortcuts={{ keys: ['a', 'w', 's'] }}
            onPlayNote={onPlayNote}
            onStopNote={onStopNote}
            data-testid="inline-keys"
          />
        </>
      )
    }
    render(<Subject />)
    const root = screen.getByTestId('inline-keys')
    act(() => root.focus())

    act(() => {
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
      )
    })
    expect(onPlayNote).toHaveBeenCalledWith(60, undefined)

    act(() => screen.getByText('rerender').click())

    expect(onStopNote).not.toHaveBeenCalled()
  })
})
