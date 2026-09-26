import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

import { SHORTCUTS } from '@tremolo-ui/dom'

import { pointerEvent, withPointerCapture } from '../../helpers'

import PianoFixture from './PianoFixture.svelte'

function setup(props: Record<string, unknown> = {}) {
  const onPlayNote = vi.fn()
  const onStopNote = vi.fn()
  const view = render(PianoFixture, {
    props: { onPlayNote, onStopNote, ...props },
  })
  const piano = screen.getByTestId('piano')
  withPointerCapture(piano)
  // jsdom lays nothing out: 7 white keys of 40px plus a 1px gap.
  piano.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 287,
      bottom: 160,
      width: 287,
      height: 160,
    }) as DOMRect
  const key = (note: number) =>
    piano.querySelector(`[data-note="${note}"]`) as HTMLElement
  return { view, piano, key, onPlayNote, onStopNote }
}

describe('Piano', () => {
  test('draws one key per note, placed by the layout', () => {
    const { piano, key } = setup()
    expect(piano.children).toHaveLength(12)
    expect(key(48)).toHaveAttribute('data-note-key', 'C')
    expect(key(50).style.left).toBe('41px')
    expect(piano.style.width).toBe('287px')
  })

  test('a press plays the key under the pointer and marks it active', async () => {
    const { piano, key, onPlayNote, onStopNote } = setup()
    piano.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 20, clientY: 150 }),
    )
    await tick()
    expect(onPlayNote).toHaveBeenCalledWith(48, undefined)
    expect(key(48)).toHaveAttribute('data-active', '')
    piano.dispatchEvent(
      pointerEvent('pointerup', { clientX: 20, clientY: 150 }),
    )
    expect(onStopNote).toHaveBeenCalledWith(48)
  })

  test('keyboard shortcuts play notes while the piano has focus', async () => {
    const { piano, onPlayNote } = setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })
    piano.focus()
    await fireEvent.keyDown(piano, { key: 'a', code: 'KeyA' })
    expect(onPlayNote).toHaveBeenCalledWith(48, undefined)
  })

  test('playNote starts a note from outside', async () => {
    const { view, key, onPlayNote } = setup()
    ;(view.component as unknown as { play: (n: number) => void }).play(52)
    await tick()
    expect(onPlayNote).toHaveBeenCalledWith(52, 100)
    expect(key(52)).toHaveAttribute('data-active', '')
  })

  test('keys above midiMax are disabled', () => {
    const { key } = setup({ midiMax: 55 })
    expect(key(56)).toHaveAttribute('data-disabled', '')
    expect(key(55)).not.toHaveAttribute('data-disabled')
  })

  test('keyProps adds attributes, but cannot move the key', () => {
    const { key } = setup({
      keyProps: (note: number) => ({
        'data-root': note === 48 ? '' : undefined,
        style: 'left: 999px; color: red',
      }),
    })
    expect(key(48)).toHaveAttribute('data-root', '')
    expect(key(48).style.color).toBe('red')
    expect(key(48).style.left).toBe('0px')
  })

  test('label draws inside each key', () => {
    const { key } = setup({ withLabel: true })
    expect(key(48).textContent).toBe('48')
  })
})
