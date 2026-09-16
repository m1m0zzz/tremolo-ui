/**
 * jsdom has neither `DragEvent` nor `DataTransfer`, so both are faked with
 * only what a drop zone reads: the `types` list and the `items` during the
 * drag, and the `files` on the drop.
 */
export function dragEvent(
  type: string,
  init: { files?: File[]; types?: string[] } = {},
) {
  const { files = [], types = ['Files'] } = init
  const event = new Event(type, { bubbles: true, cancelable: true })
  const dataTransfer = {
    types,
    dropEffect: 'none',
    files,
    items: files.map((file) => ({ kind: 'file', type: file.type })),
  }
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })
  return event as Event & { dataTransfer: typeof dataTransfer }
}

/**
 * What a browser reports while a drag is still in the air: the type of each
 * file, but never its name.
 */
export function dragOf(...types: string[]) {
  const event = dragEvent('dragenter')
  event.dataTransfer.items = types.map((type) => ({ kind: 'file', type }))
  event.dataTransfer.files = []
  return event
}

export function file(name: string, type: string) {
  return new File(['x'], name, { type })
}
