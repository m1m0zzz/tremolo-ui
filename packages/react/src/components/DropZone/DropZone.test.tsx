import { fireEvent, render, screen } from '@testing-library/react'

import { DropZone } from '.'

function file(name: string, type: string) {
  return new File(['x'], name, { type })
}

/**
 * jsdom has neither `DragEvent` nor `DataTransfer`, so the event is built with
 * only what a drop zone reads.
 */
function drag(
  element: Element,
  type: string,
  init: { files?: File[]; types?: string[] } = {},
) {
  const { files = [], types = ['Files'] } = init
  fireEvent(
    element,
    Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
      dataTransfer: {
        types,
        dropEffect: 'none',
        files,
        items: files.map((file) => ({ kind: 'file', type: file.type })),
      },
    }),
  )
}

function setup(props: Partial<Parameters<typeof DropZone.Root>[0]> = {}) {
  render(<DropZone.Root {...props}>Drop here</DropZone.Root>)
  return screen.getByText('Drop here')
}

test('a drag over the zone is on the element as a data attribute', () => {
  const zone = setup({ accept: 'audio/*' })
  expect(zone).not.toHaveAttribute('data-dragover')

  drag(zone, 'dragenter', { files: [file('a.wav', 'audio/wav')] })
  expect(zone).toHaveAttribute('data-dragover', '')
  expect(zone).not.toHaveAttribute('data-invalid')

  drag(zone, 'dragleave', { files: [file('a.wav', 'audio/wav')] })
  expect(zone).not.toHaveAttribute('data-dragover')
})

test('a drag the zone will not take is marked while it is in the air', () => {
  const zone = setup({ accept: 'audio/*' })

  drag(zone, 'dragenter', { files: [file('cover.png', 'image/png')] })

  expect(zone).toHaveAttribute('data-dragover', '')
  expect(zone).toHaveAttribute('data-invalid', '')
})

test('the dropped files arrive', () => {
  const onDrop = vi.fn()
  const zone = setup({ multiple: true, onDrop })

  drag(zone, 'drop', {
    files: [file('a.wav', 'audio/wav'), file('b.wav', 'audio/wav')],
  })

  expect(onDrop.mock.calls[0][0].map((f: File) => f.name)).toEqual([
    'a.wav',
    'b.wav',
  ])
  expect(zone).not.toHaveAttribute('data-dragover')
})

test('accept splits the drop between onDrop and onReject', () => {
  const onDrop = vi.fn()
  const onReject = vi.fn()
  const zone = setup({ accept: 'audio/*', multiple: true, onDrop, onReject })

  drag(zone, 'drop', {
    files: [file('a.wav', 'audio/wav'), file('cover.png', 'image/png')],
  })

  expect(onDrop.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.wav'])
  expect(onReject.mock.calls[0][0].map((f: File) => f.name)).toEqual([
    'cover.png',
  ])
})

test('disabled takes nothing and is on the element', () => {
  const onDrop = vi.fn()
  const zone = setup({ disabled: true, onDrop })

  expect(zone).toHaveAttribute('data-disabled', '')

  drag(zone, 'drop', { files: [file('a.wav', 'audio/wav')] })
  expect(onDrop).not.toHaveBeenCalled()
})

test('a setting changed by a re-render reaches the zone', () => {
  const onDrop = vi.fn()
  const { rerender } = render(
    <DropZone.Root accept="audio/*" onDrop={onDrop}>
      Drop here
    </DropZone.Root>,
  )
  const zone = screen.getByText('Drop here')

  rerender(
    <DropZone.Root accept="image/*" onDrop={onDrop}>
      Drop here
    </DropZone.Root>,
  )

  drag(zone, 'drop', { files: [file('cover.png', 'image/png')] })
  expect(onDrop).toHaveBeenCalledTimes(1)
})
