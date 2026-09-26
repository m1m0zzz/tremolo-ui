import { fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, h, nextTick } from 'vue'

import {
  AnimationCanvas,
  DropZone,
  FileInput,
  FileInputTrigger,
} from '../../src'

describe('AnimationCanvas', () => {
  let flush: () => void

  beforeEach(() => {
    const context = {
      getLineDash: vi.fn(() => []),
      getTransform: vi.fn(() => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
    }
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => context,
    ) as unknown as HTMLCanvasElement['getContext']
    let id = 0
    const frames = new Map<number, FrameRequestCallback>()
    globalThis.requestAnimationFrame = (callback) => {
      frames.set(++id, callback)
      return id
    }
    globalThis.cancelAnimationFrame = (handle) => {
      frames.delete(handle)
    }
    flush = () => {
      const queued = [...frames.values()]
      frames.clear()
      for (const callback of queued) callback(performance.now())
    }
  })

  test('draws on every frame while animating', async () => {
    const draw = vi.fn()
    const init = vi.fn()
    const { container } = render(AnimationCanvas, {
      props: { draw, init, width: 120, height: 80 },
    })
    await nextTick()
    flush()
    expect(init).toHaveBeenCalledWith(expect.anything(), {
      width: 120,
      height: 80,
    })
    flush()
    expect(draw.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(container.querySelector('canvas')!.style.width).toBe('120px')
  })
})

describe('FileInput', () => {
  function setup(props: Record<string, unknown> = {}) {
    render(
      defineComponent({
        setup: () => () =>
          h(FileInput, { 'data-testid': 'root', ...props }, () =>
            h(FileInputTrigger, null, () => 'Open a sample'),
          ),
      }),
    )
    return screen.getByLabelText('Open a sample') as HTMLInputElement
  }

  test('picked files are split by accept, and the input is cleared', async () => {
    const onChange = vi.fn()
    const onReject = vi.fn()
    const input = setup({ accept: 'audio/*', onChange, onReject })
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
    const input = setup({ disabled: true })
    expect(input).toBeDisabled()
    expect(screen.getByText('Open a sample')).toHaveAttribute(
      'data-disabled',
      '',
    )
  })
})

describe('DropZone', () => {
  function dragEvent(type: string, files: File[]) {
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
    render(
      defineComponent({
        setup: () => () =>
          h(DropZone, { 'data-testid': 'zone', onDrop }, () => 'Drop here'),
      }),
    )
    await nextTick()
    const zone = screen.getByTestId('zone')
    const wav = new File([''], 'a.wav', { type: 'audio/wav' })
    zone.dispatchEvent(dragEvent('dragenter', [wav]))
    await nextTick()
    expect(zone).toHaveAttribute('data-dragover', '')
    zone.dispatchEvent(dragEvent('drop', [wav]))
    await nextTick()
    expect(zone).not.toHaveAttribute('data-dragover')
    expect(onDrop).toHaveBeenCalledWith([wav], expect.any(Event))
  })
})
