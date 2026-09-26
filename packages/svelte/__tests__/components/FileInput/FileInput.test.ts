import { fireEvent, render, screen } from '@testing-library/svelte'

import FileInputFixture from './FileInputFixture.svelte'

test('the trigger names the file input', () => {
  render(FileInputFixture)
  const input = screen.getByLabelText('Open a sample')
  expect(input).toHaveAttribute('type', 'file')
})

test('picked files are split by accept, and the input is cleared', async () => {
  const onChange = vi.fn()
  const onReject = vi.fn()
  render(FileInputFixture, { props: { accept: 'audio/*', onChange, onReject } })
  const input = screen.getByLabelText('Open a sample') as HTMLInputElement
  const wav = new File([''], 'a.wav', { type: 'audio/wav' })
  const png = new File([''], 'b.png', { type: 'image/png' })
  Object.defineProperty(input, 'files', {
    value: [wav, png],
    configurable: true,
  })
  await fireEvent.change(input)
  expect(onChange).toHaveBeenCalledWith([wav])
  expect(onReject).toHaveBeenCalledWith([png])
  expect(input.value).toBe('')
})

test('disabled reaches the input and the parts', () => {
  render(FileInputFixture, { props: { disabled: true } })
  expect(screen.getByLabelText('Open a sample')).toBeDisabled()
  expect(screen.getByText('Open a sample')).toHaveAttribute('data-disabled', '')
  expect(screen.getByTestId('root')).toHaveAttribute('data-disabled', '')
})
