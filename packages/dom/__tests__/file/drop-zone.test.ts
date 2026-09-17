import { createDropZone, type DropZoneState } from '../../src/file/drop-zone'

import { dragEvent, dragOf, file } from './helpers'

let element: HTMLElement
let states: DropZoneState[]

beforeEach(() => {
  element = document.createElement('div')
  document.body.append(element)
  states = []
})

afterEach(() => {
  element.remove()
})

function zone(options: Parameters<typeof createDropZone>[1] = {}) {
  return createDropZone(element, {
    onStateChange: (state) => states.push({ ...state }),
    ...options,
  })
}

test('a drag over the element is reported, and the drop is offered', () => {
  const instance = zone()

  element.dispatchEvent(dragOf('audio/wav'))
  expect(instance.state).toEqual({ over: true, invalid: false })

  const over = dragEvent('dragover')
  element.dispatchEvent(over)
  // Cancelling dragover is what makes the element a drop target at all.
  expect(over.defaultPrevented).toBe(true)
  expect(over.dataTransfer.dropEffect).toBe('copy')

  instance.destroy()
})

test('a drag that carries no file is left alone', () => {
  const instance = zone()

  const over = dragEvent('dragover', { types: ['text/plain'] })
  element.dispatchEvent(over)

  expect(instance.state.over).toBe(false)
  expect(over.defaultPrevented).toBe(false)
  instance.destroy()
})

test('leaving a child does not end the drag', () => {
  const child = document.createElement('span')
  element.append(child)
  const instance = zone()

  element.dispatchEvent(dragOf('audio/wav'))
  // Moving onto the child: it enters before the parent is left.
  child.dispatchEvent(dragOf('audio/wav'))
  element.dispatchEvent(dragEvent('dragleave'))

  expect(instance.state.over).toBe(true)

  element.dispatchEvent(dragEvent('dragleave'))
  expect(instance.state.over).toBe(false)
  instance.destroy()
})

test('what accept refuses is marked while it is still in the air', () => {
  const instance = zone({ accept: 'audio/*' })

  element.dispatchEvent(dragOf('image/png'))
  expect(instance.state).toEqual({ over: true, invalid: true })

  const over = dragEvent('dragover')
  element.dispatchEvent(over)
  expect(over.dataTransfer.dropEffect).toBe('none')

  instance.destroy()
})

test('an extension rule cannot be decided before the drop', () => {
  const instance = zone({ accept: '.wav' })

  // The name is withheld during a drag, so nothing is refused yet.
  element.dispatchEvent(dragOf('application/octet-stream'))
  expect(instance.state.invalid).toBe(false)

  instance.destroy()
})

test('the dropped files arrive, and the page is not navigated away', () => {
  const onDrop = vi.fn()
  const instance = zone({ multiple: true, onDrop })

  element.dispatchEvent(dragOf('audio/wav'))
  const drop = dragEvent('drop', {
    files: [file('a.wav', 'audio/wav'), file('b.wav', 'audio/wav')],
  })
  element.dispatchEvent(drop)

  expect(drop.defaultPrevented).toBe(true)
  expect(onDrop.mock.calls[0][0].map((f: File) => f.name)).toEqual([
    'a.wav',
    'b.wav',
  ])
  expect(instance.state.over).toBe(false)
  instance.destroy()
})

test('accept splits the drop between onDrop and onReject', () => {
  const onDrop = vi.fn()
  const onReject = vi.fn()
  const instance = zone({ accept: 'audio/*', multiple: true, onDrop, onReject })

  element.dispatchEvent(
    dragEvent('drop', {
      files: [file('a.wav', 'audio/wav'), file('cover.png', 'image/png')],
    }),
  )

  expect(onDrop.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.wav'])
  expect(onReject.mock.calls[0][0].map((f: File) => f.name)).toEqual([
    'cover.png',
  ])
  instance.destroy()
})

test('without multiple, only the first accepted file is taken', () => {
  const onDrop = vi.fn()
  const instance = zone({ onDrop })

  element.dispatchEvent(
    dragEvent('drop', {
      files: [file('a.wav', 'audio/wav'), file('b.wav', 'audio/wav')],
    }),
  )

  expect(onDrop.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.wav'])
  instance.destroy()
})

test('disabled swallows the drop rather than letting the browser open it', () => {
  const onDrop = vi.fn()
  const instance = zone({ disabled: true, onDrop })

  element.dispatchEvent(dragOf('audio/wav'))
  const over = dragEvent('dragover')
  element.dispatchEvent(over)
  expect(over.dataTransfer.dropEffect).toBe('none')

  const drop = dragEvent('drop', { files: [file('a.wav', 'audio/wav')] })
  element.dispatchEvent(drop)

  expect(drop.defaultPrevented).toBe(true)
  expect(onDrop).not.toHaveBeenCalled()
  instance.destroy()
})

test('a drag that ends elsewhere still clears the state', () => {
  const instance = zone()

  element.dispatchEvent(dragOf('audio/wav'))
  expect(instance.state.over).toBe(true)

  // Dropped on another element, or cancelled with Esc: no dragleave arrives.
  document.dispatchEvent(new Event('dragend', { bubbles: true }))
  expect(instance.state.over).toBe(false)

  instance.destroy()
})

test('the state is reported only when it changes', () => {
  const instance = zone({ accept: 'audio/*' })

  element.dispatchEvent(dragOf('audio/wav'))
  element.dispatchEvent(dragEvent('dragover'))
  element.dispatchEvent(dragEvent('dragover'))

  expect(states).toEqual([{ over: true, invalid: false }])
  instance.destroy()
})

test('update replaces the settings without dropping the listeners', () => {
  const onDrop = vi.fn()
  const instance = zone({ accept: 'audio/*', onDrop })

  instance.update({ accept: 'image/*' })
  element.dispatchEvent(dragOf('image/png'))
  expect(instance.state.invalid).toBe(false)

  element.dispatchEvent(
    dragEvent('drop', { files: [file('cover.png', 'image/png')] }),
  )
  expect(onDrop).toHaveBeenCalledTimes(1)

  instance.destroy()
})

test('destroy stops listening', () => {
  const instance = zone()
  instance.destroy()

  element.dispatchEvent(dragOf('audio/wav'))
  expect(instance.state.over).toBe(false)
  expect(states).toEqual([])
})
