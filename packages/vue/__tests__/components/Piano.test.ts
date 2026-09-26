import { fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, h, nextTick, ref } from 'vue'

import { SHORTCUTS } from '@tremolo-ui/dom'

import { Piano } from '../../src'
import { pointerEvent, withPointerCapture } from '../helpers'

async function setup(props: Record<string, unknown> = {}, withLabel = false) {
  const onPlayNote = vi.fn()
  const onStopNote = vi.fn()
  const piano = ref<{ playNote: (n: number, v?: number) => void }>()
  render(
    defineComponent({
      setup: () => () =>
        h(
          Piano,
          {
            ref: piano,
            noteRange: { first: 48, last: 59 },
            'data-testid': 'piano',
            onPlayNote,
            onStopNote,
            ...props,
          },
          withLabel
            ? { label: ({ note }: { note: number }) => String(note) }
            : undefined,
        ),
    }),
  )
  await nextTick()
  const element = screen.getByTestId('piano')
  withPointerCapture(element)
  element.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 287,
      bottom: 160,
      width: 287,
      height: 160,
    }) as DOMRect
  const key = (note: number) =>
    element.querySelector(`[data-note="${note}"]`) as HTMLElement
  return { element, key, onPlayNote, onStopNote, piano }
}

describe('Piano', () => {
  test('draws one key per note, placed by the layout', async () => {
    const { element, key } = await setup()
    expect(element.children).toHaveLength(12)
    expect(key(48)).toHaveAttribute('data-note-key', 'C')
    expect(key(50).style.left).toBe('41px')
    expect(element.style.width).toBe('287px')
  })

  test('a press plays the key under the pointer and marks it active', async () => {
    const { element, key, onPlayNote, onStopNote } = await setup()
    element.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 20, clientY: 150 }),
    )
    await nextTick()
    expect(onPlayNote).toHaveBeenCalledWith(48, undefined)
    expect(key(48)).toHaveAttribute('data-active', '')
    element.dispatchEvent(
      pointerEvent('pointerup', { clientX: 20, clientY: 150 }),
    )
    expect(onStopNote).toHaveBeenCalledWith(48)
  })

  test('keyboard shortcuts play notes while the piano has focus', async () => {
    const { element, onPlayNote } = await setup({
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    })
    element.focus()
    await fireEvent.keyDown(element, { key: 'a', code: 'KeyA' })
    expect(onPlayNote).toHaveBeenCalledWith(48, undefined)
  })

  test('playNote starts a note from outside', async () => {
    const { key, onPlayNote, piano } = await setup()
    piano.value?.playNote(52, 100)
    await nextTick()
    expect(onPlayNote).toHaveBeenCalledWith(52, 100)
    expect(key(52)).toHaveAttribute('data-active', '')
  })

  test('keyProps adds attributes, but cannot move the key', async () => {
    const { key } = await setup({
      keyProps: (note: number) => ({
        'data-root': note === 48 ? '' : undefined,
        style: { left: '999px', color: 'red' },
      }),
    })
    expect(key(48)).toHaveAttribute('data-root', '')
    expect(key(48).style.color).toBe('red')
    expect(key(48).style.left).toBe('0px')
  })

  test('the label slot draws inside each key', async () => {
    const { key } = await setup({}, true)
    expect(key(48).textContent).toBe('48')
  })
})
