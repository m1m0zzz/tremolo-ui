import { render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

import DropZoneFixture from './DropZoneFixture.svelte'

function dragEvent(type: string, files: File[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      types: ['Files'],
      files,
      items: files.map((file) => ({ kind: 'file', type: file.type })),
    },
  })
  return event
}

test('marks a drag over it and takes the dropped files', async () => {
  const onDrop = vi.fn()
  render(DropZoneFixture, { props: { onDrop } })
  const zone = screen.getByTestId('zone')
  const wav = new File([''], 'a.wav', { type: 'audio/wav' })

  zone.dispatchEvent(dragEvent('dragenter', [wav]))
  await tick()
  expect(zone).toHaveAttribute('data-dragover', '')

  zone.dispatchEvent(dragEvent('drop', [wav]))
  await tick()
  expect(zone).not.toHaveAttribute('data-dragover')
  expect(onDrop).toHaveBeenCalledWith([wav], expect.any(Event))
})

test('marks a drag it would refuse as invalid', async () => {
  render(DropZoneFixture, { props: { accept: 'audio/*' } })
  const zone = screen.getByTestId('zone')
  zone.dispatchEvent(
    dragEvent('dragenter', [new File([''], 'b.png', { type: 'image/png' })]),
  )
  await tick()
  expect(zone).toHaveAttribute('data-invalid', '')
})
