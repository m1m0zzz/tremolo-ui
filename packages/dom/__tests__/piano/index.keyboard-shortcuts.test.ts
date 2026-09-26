import { noteNumber } from '@tremolo-ui/functions'

import { createPianoInput } from '../../src/piano'
import { type PianoLayout } from '../../src/piano/layout'
import { SHORTCUTS } from '../../src/piano/shortcuts'

const layout: PianoLayout = {
  noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
  whiteKeyWidth: 40,
}

const instances: { destroy: () => void }[] = []

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy()
  document.body.replaceChildren()
})

function setup(options: Partial<Parameters<typeof createPianoInput>[1]> = {}) {
  const element = document.createElement('div')
  element.tabIndex = 0
  document.body.appendChild(element)
  const onPlayNote = vi.fn()
  const onStopNote = vi.fn()
  const instance = createPianoInput(element, {
    layout,
    keyboardShortcuts: SHORTCUTS.HOME_ROW,
    onPlayNote,
    onStopNote,
    ...options,
  })
  instances.push(instance)
  return { element, instance, onPlayNote, onStopNote }
}

function key(
  target: EventTarget,
  type: 'keydown' | 'keyup',
  key: string,
  init: KeyboardEventInit = {},
) {
  target.dispatchEvent(
    new KeyboardEvent(type, { key, code: `Key${key}`, bubbles: true, ...init }),
  )
}

test('a key plays its note until it is released', () => {
  const { element, onPlayNote, onStopNote } = setup()
  key(element, 'keydown', 'a')
  expect(onPlayNote).toHaveBeenCalledWith(noteNumber('C3'), undefined)
  key(element, 'keyup', 'a')
  expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
})

test('auto-repeat and a second keydown do not replay the note', () => {
  const { element, onPlayNote } = setup()
  key(element, 'keydown', 'a')
  key(element, 'keydown', 'a', { repeat: true })
  key(element, 'keydown', 'a')
  expect(onPlayNote).toHaveBeenCalledTimes(1)
})

test('keys past noteRange.last and empty entries play nothing', () => {
  const { element, onPlayNote } = setup({
    layout: { ...layout, noteRange: { first: 48, last: 48 } },
  })
  key(element, 'keydown', 'w')
  expect(onPlayNote).not.toHaveBeenCalled()
})

test('with root scope, only keys inside the element count', () => {
  const { onPlayNote } = setup()
  key(window, 'keydown', 'a')
  expect(onPlayNote).not.toHaveBeenCalled()
})

test('with window scope, keys anywhere count except in an editable element', () => {
  const { onPlayNote } = setup({ keyboardShortcutsScope: 'window' })
  const input = document.createElement('input')
  document.body.appendChild(input)
  key(input, 'keydown', 'a')
  expect(onPlayNote).not.toHaveBeenCalled()
  key(document.body, 'keydown', 'a')
  expect(onPlayNote).toHaveBeenCalledTimes(1)
})

test('the focus leaving the element releases the keys', () => {
  const { element, onStopNote } = setup()
  key(element, 'keydown', 'a')
  element.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }))
  expect(onStopNote).toHaveBeenCalledWith(noteNumber('C3'))
})

test('the focus moving inside the element keeps them held', () => {
  const { element, onStopNote } = setup()
  const child = document.createElement('button')
  element.appendChild(child)
  key(element, 'keydown', 'a')
  element.dispatchEvent(new FocusEvent('focusout', { relatedTarget: child }))
  expect(onStopNote).not.toHaveBeenCalled()
})

test('the window losing focus releases every key', () => {
  const { element, onStopNote } = setup()
  key(element, 'keydown', 'a')
  key(element, 'keydown', 's')
  window.dispatchEvent(new Event('blur'))
  expect(onStopNote.mock.calls.map(([note]) => note)).toEqual([
    noteNumber('C3'),
    noteNumber('D3'),
  ])
})

describe('update', () => {
  test('the same keys in a new array keep the notes held', () => {
    const { element, instance, onStopNote } = setup()
    key(element, 'keydown', 'a')
    instance.update({
      keyboardShortcuts: { keys: [...SHORTCUTS.HOME_ROW.keys] },
    })
    expect(onStopNote).not.toHaveBeenCalled()
  })

  test('a new note range releases the keys, and the keyup is ignored', () => {
    const { element, instance, onStopNote } = setup()
    key(element, 'keydown', 'a')
    instance.update({
      layout: { ...layout, noteRange: { first: 60, last: 83 } },
    })
    expect(onStopNote).toHaveBeenCalledTimes(1)
    key(element, 'keyup', 'a')
    expect(onStopNote).toHaveBeenCalledTimes(1)
  })

  test('removing the shortcuts releases the keys and stops listening', () => {
    const { element, instance, onPlayNote, onStopNote } = setup()
    key(element, 'keydown', 'a')
    instance.update({ keyboardShortcuts: undefined })
    expect(onStopNote).toHaveBeenCalledTimes(1)
    key(element, 'keydown', 's')
    expect(onPlayNote).toHaveBeenCalledTimes(1)
  })

  test('adding shortcuts later starts listening', () => {
    const { element, instance, onPlayNote } = setup({
      keyboardShortcuts: undefined,
    })
    key(element, 'keydown', 'a')
    instance.update({ keyboardShortcuts: SHORTCUTS.HOME_ROW })
    key(element, 'keydown', 'a')
    expect(onPlayNote).toHaveBeenCalledTimes(1)
  })

  test('switching the scope moves the listeners', () => {
    const { instance, onPlayNote } = setup()
    instance.update({ keyboardShortcutsScope: 'window' })
    key(document.body, 'keydown', 'a')
    expect(onPlayNote).toHaveBeenCalledTimes(1)
  })
})

test('destroy stops listening', () => {
  const { element, instance, onPlayNote } = setup()
  instance.destroy()
  key(element, 'keydown', 'a')
  expect(onPlayNote).not.toHaveBeenCalled()
})
