import { render } from '@testing-library/svelte'
import { tick } from 'svelte'

import { AnimationCanvas } from '../../../src/index.js'

import StateDrivenCanvas from './StateDrivenCanvas.svelte'

/** jsdom has no 2D context and no animation frames, so both are faked. */
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

let flush: () => void

test('draws on every frame while animating', () => {
  const draw = vi.fn()
  const init = vi.fn()
  const { container } = render(AnimationCanvas, {
    props: { draw, init, width: 120, height: 80 },
  })
  flush()
  // Set up on the first frame, before it is drawn.
  expect(init).toHaveBeenCalledWith(expect.anything(), {
    width: 120,
    height: 80,
  })
  flush()
  expect(draw.mock.calls.length).toBeGreaterThanOrEqual(2)
  const canvas = container.querySelector('canvas')!
  expect(canvas.style.width).toBe('120px')
})

test('the context menu is suppressed by default', () => {
  const { container } = render(AnimationCanvas, {
    props: { draw: vi.fn() },
  })
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
  })
  container.querySelector('canvas')!.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
})

test('without animating, a new draw is painted at once', async () => {
  const onDraw = vi.fn()
  const { component } = render(StateDrivenCanvas, { props: { onDraw } })
  flush()
  expect(onDraw).toHaveBeenLastCalledWith('first:1')
  ;(component as unknown as { relabel: (label: string) => void }).relabel(
    'second',
  )
  await tick()
  // Drawn again by the same canvas: the frame count carries on.
  expect(onDraw).toHaveBeenLastCalledWith('second:2')
})
