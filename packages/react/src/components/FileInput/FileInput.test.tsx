import { fireEvent, render, screen } from '@testing-library/react'

import { FileInput } from '.'

/** jsdom builds a `File` from parts like a browser does. */
function file(name: string, type: string) {
  return new File(['x'], name, { type })
}

/**
 * `input.files` is read-only, so a selection is staged the way the browser
 * would leave it before firing the event.
 */
function select(input: HTMLInputElement, ...files: File[]) {
  Object.defineProperty(input, 'files', {
    value: files,
    configurable: true,
    writable: true,
  })
  fireEvent.change(input)
}

function setup(props: Partial<Parameters<typeof FileInput.Root>[0]> = {}) {
  render(
    <FileInput.Root {...props}>
      <FileInput.Trigger>Choose</FileInput.Trigger>
    </FileInput.Root>,
  )
  return screen.getByLabelText('Choose') as HTMLInputElement
}

test('the trigger names the hidden file input', () => {
  const input = setup()
  expect(input).toHaveAttribute('type', 'file')
  // Visually hidden, but still focusable and still the control.
  expect(input).not.toBeDisabled()
  expect(input.style.position).toBe('absolute')
})

test('accept and multiple reach the input', () => {
  const input = setup({ accept: 'audio/*', multiple: true })
  expect(input).toHaveAttribute('accept', 'audio/*')
  expect(input).toHaveAttribute('multiple')
})

test('the picked files arrive as an array', () => {
  const onChange = vi.fn()
  const input = setup({ multiple: true, onChange })

  select(input, file('a.wav', 'audio/wav'), file('b.wav', 'audio/wav'))

  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange.mock.calls[0][0].map((f: File) => f.name)).toEqual([
    'a.wav',
    'b.wav',
  ])
})

test('what accept refuses goes to onReject instead', () => {
  const onChange = vi.fn()
  const onReject = vi.fn()
  const input = setup({ accept: 'audio/*', multiple: true, onChange, onReject })

  select(input, file('a.wav', 'audio/wav'), file('cover.png', 'image/png'))

  expect(onChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.wav'])
  expect(onReject.mock.calls[0][0].map((f: File) => f.name)).toEqual([
    'cover.png',
  ])
})

test('onChange is not called when every file was refused', () => {
  const onChange = vi.fn()
  const onReject = vi.fn()
  const input = setup({ accept: 'audio/*', onChange, onReject })

  select(input, file('cover.png', 'image/png'))

  expect(onChange).not.toHaveBeenCalled()
  expect(onReject).toHaveBeenCalledTimes(1)
})

test('the input is cleared, so the same file can be picked twice', () => {
  const onChange = vi.fn()
  const input = setup({ onChange })

  select(input, file('a.wav', 'audio/wav'))
  expect(input.value).toBe('')

  select(input, file('a.wav', 'audio/wav'))
  expect(onChange).toHaveBeenCalledTimes(2)
})

test('dismissing the picker reports nothing', () => {
  const onChange = vi.fn()
  const onReject = vi.fn()
  const input = setup({ onChange, onReject })

  select(input)

  expect(onChange).not.toHaveBeenCalled()
  expect(onReject).not.toHaveBeenCalled()
})

test('disabled marks every part and turns the input off', () => {
  const input = setup({ disabled: true })

  expect(input).toBeDisabled()
  expect(screen.getByText('Choose')).toHaveAttribute('data-disabled', '')
  expect(input.closest('div')).toHaveAttribute('data-disabled', '')
})
