import {
  createAnimationCanvas,
  type AnimationCanvasOptions,
  type AnimationFrame,
} from '../../src/canvas/animation'

import {
  withAnimationFrame,
  withContext2D,
  withResizeObserver,
  type AnimationFrameControl,
  type FakeContext,
  type ResizeObserverControl,
} from './helpers'

const instances: { destroy: () => void }[] = []

let frames: AnimationFrameControl
let resizeObserver: ResizeObserverControl

function setup(
  options: Partial<AnimationCanvasOptions> = {},
  { withParent = false } = {},
) {
  const canvas = document.createElement('canvas')
  const parent = document.createElement('div')
  if (withParent) {
    parent.appendChild(canvas)
    document.body.appendChild(parent)
  } else {
    document.body.appendChild(canvas)
  }
  const context = withContext2D(canvas) as FakeContext

  const draw = jest.fn()
  const init = jest.fn()

  const instance = createAnimationCanvas(canvas, {
    draw,
    init,
    ...options,
  })
  instances.push(instance)

  return { canvas, parent, context, draw, init, instance }
}

/** The frame passed to the last call of a draw handler. */
function lastFrame(draw: jest.Mock): AnimationFrame {
  return draw.mock.calls[draw.mock.calls.length - 1][1]
}

beforeEach(() => {
  withContext2D()
  frames = withAnimationFrame()
  resizeObserver = withResizeObserver()
  globalThis.devicePixelRatio = 1
})

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy()
  document.body.innerHTML = ''
})

describe('createAnimationCanvas', () => {
  test('gives the canvas a backing store scaled by the device pixel ratio', () => {
    globalThis.devicePixelRatio = 2
    const { canvas, context } = setup({ size: { width: 120, height: 80 } })

    expect(canvas.width).toBe(240)
    expect(canvas.height).toBe(160)
    expect(canvas.style.width).toBe('120px')
    expect(canvas.style.height).toBe('80px')
    // Reset to the identity matrix first, so the scale does not accumulate.
    expect(context.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)
    expect(context.scale).toHaveBeenCalledWith(2, 2)
  })

  test('reports the size in CSS pixels, not device pixels', () => {
    globalThis.devicePixelRatio = 3
    const { draw } = setup({ size: { width: 120, height: 80 } })

    frames.flush()
    expect(lastFrame(draw).width).toBe(120)
    expect(lastFrame(draw).height).toBe(80)
  })

  test('runs init once, before the first frame', () => {
    const { draw, init } = setup({ size: { width: 10, height: 10 } })

    frames.flush()
    frames.flush()

    expect(init).toHaveBeenCalledTimes(1)
    expect(init).toHaveBeenCalledWith(expect.anything(), {
      width: 10,
      height: 10,
    })
    expect(init.mock.invocationCallOrder[0]).toBeLessThan(
      draw.mock.invocationCallOrder[0],
    )
  })

  test('counts frames from 0', () => {
    const { draw } = setup()

    frames.flush()
    expect(lastFrame(draw).count).toBe(0)
    frames.flush()
    expect(lastFrame(draw).count).toBe(1)
    frames.flush()
    expect(lastFrame(draw).count).toBe(2)
  })

  test('keeps requesting the next frame while animating', () => {
    setup()
    expect(frames.pending()).toBe(1)
    frames.flush()
    expect(frames.pending()).toBe(1)
  })
})

describe('update', () => {
  // The reason the core exists: a wrapper passes a fresh inline `draw` on
  // every render, and that must not restart the animation.
  test('swaps the draw handler without resetting the frame count', () => {
    const { instance, draw } = setup()

    frames.flush()
    frames.flush()
    expect(lastFrame(draw).count).toBe(1)

    const next = jest.fn()
    instance.update({ draw: next })
    frames.flush()

    expect(next).toHaveBeenCalledTimes(1)
    expect(lastFrame(next).count).toBe(2)
    expect(draw).toHaveBeenCalledTimes(2)
  })

  test('swapping the handler does not run init again', () => {
    const { instance, init } = setup()

    frames.flush()
    instance.update({ draw: jest.fn() })
    frames.flush()

    expect(init).toHaveBeenCalledTimes(1)
  })

  test('elapsedTime keeps running across an update', () => {
    const { instance, draw } = setup()

    frames.flush()
    const before = lastFrame(draw).elapsedTime

    const next = jest.fn()
    instance.update({ draw: next })
    frames.flush()

    expect(lastFrame(next).elapsedTime).toBeGreaterThanOrEqual(before)
  })

  test('turning animate off stops the loop, turning it on starts it', () => {
    const { instance, draw } = setup()

    frames.flush()
    const drawn = draw.mock.calls.length

    instance.update({ animate: false })
    frames.flush()
    expect(frames.pending()).toBe(0)
    expect(draw).toHaveBeenCalledTimes(drawn)

    instance.update({ animate: true })
    expect(frames.pending()).toBe(1)
    frames.flush()
    expect(draw.mock.calls.length).toBeGreaterThan(drawn)
  })

  test('a new size re-applies the device pixel ratio config', () => {
    globalThis.devicePixelRatio = 2
    const { canvas, instance, draw } = setup({
      size: { width: 100, height: 100 },
    })

    instance.update({ size: { width: 50, height: 25 } })

    expect(canvas.width).toBe(100)
    expect(canvas.height).toBe(50)
    expect(canvas.style.width).toBe('50px')
    frames.flush()
    expect(lastFrame(draw).width).toBe(50)
    expect(lastFrame(draw).height).toBe(25)
  })

  test('the same size does not touch the canvas', () => {
    const { canvas, instance, context } = setup({
      size: { width: 100, height: 100 },
    })
    const before = context.scale.mock.calls.length

    instance.update({ size: { width: 100, height: 100 } })

    expect(context.scale.mock.calls.length).toBe(before)
    expect(canvas.width).toBe(100)
  })
})

describe('animate: false', () => {
  test('draws once and schedules nothing', () => {
    const { draw } = setup({ animate: false })

    expect(draw).toHaveBeenCalledTimes(1)
    expect(frames.pending()).toBe(0)
  })

  test('redraw() draws another frame', () => {
    const { instance, draw } = setup({ animate: false })

    instance.redraw()

    expect(draw).toHaveBeenCalledTimes(2)
    expect(lastFrame(draw).count).toBe(1)
  })
})

describe('relativeSize', () => {
  test('takes its size from the parent, reported by the observer', () => {
    const { parent, draw } = setup({ relativeSize: true }, { withParent: true })

    expect(resizeObserver.observed()).toEqual([parent])
    // Nothing to draw before a size is known.
    frames.flush()
    expect(draw).not.toHaveBeenCalled()

    resizeObserver.resize(200, 60)
    frames.flush()

    expect(lastFrame(draw).width).toBe(200)
    expect(lastFrame(draw).height).toBe(60)
  })

  test('redraws on a resize when not animating', () => {
    const { draw } = setup(
      { relativeSize: true, animate: false },
      { withParent: true },
    )

    expect(draw).not.toHaveBeenCalled()
    resizeObserver.resize(100, 100)
    expect(draw).toHaveBeenCalledTimes(1)
    resizeObserver.resize(150, 100)
    expect(draw).toHaveBeenCalledTimes(2)
  })

  test('carries the drawing across a resize when reduceFlickering is on', () => {
    const { context } = setup({ relativeSize: true }, { withParent: true })

    resizeObserver.resize(100, 100)
    context.drawImage.mockClear()
    resizeObserver.resize(120, 100)

    // Once onto the memo canvas, once back onto the resized one.
    expect(context.drawImage).toHaveBeenCalled()
  })

  test('keeps the snapshot at full device resolution', () => {
    // The snapshot used to be scaled down by the device pixel ratio and back
    // up again, which cost resolution on a HiDPI screen. It is now copied at
    // the canvas's own device size and drawn back at its old CSS size, so
    // nothing is resampled while the ratio stays put.
    globalThis.devicePixelRatio = 2
    const { context } = setup({ relativeSize: true }, { withParent: true })

    resizeObserver.resize(100, 80)
    context.drawImage.mockClear()
    resizeObserver.resize(150, 80)

    const [source, ...placement] = context.drawImage.mock.calls[0]
    const memo = source as HTMLCanvasElement
    // Copied at the old backing store size, in device pixels.
    expect(memo.width).toBe(200)
    expect(memo.height).toBe(160)
    // Drawn back at the old size in CSS pixels, which the context is scaled to.
    expect(placement).toEqual([0, 0, 100, 80])
  })

  test('rescales the snapshot when the device pixel ratio changes', () => {
    globalThis.devicePixelRatio = 1
    const { context } = setup({ relativeSize: true }, { withParent: true })

    resizeObserver.resize(100, 80)
    globalThis.devicePixelRatio = 2
    context.drawImage.mockClear()
    resizeObserver.resize(100, 80)

    const [source, ...placement] = context.drawImage.mock.calls[0]
    const memo = source as HTMLCanvasElement
    // Taken at the old ratio…
    expect(memo.width).toBe(100)
    // …and still placed at the same CSS size, so it lands where it was.
    expect(placement).toEqual([0, 0, 100, 80])
  })

  test('reduceFlickering off leaves the resized canvas blank', () => {
    const { context } = setup(
      { relativeSize: true, reduceFlickering: false },
      { withParent: true },
    )

    resizeObserver.resize(100, 100)
    context.drawImage.mockClear()
    resizeObserver.resize(120, 100)

    expect(context.drawImage).not.toHaveBeenCalled()
  })

  test('needs a parent element', () => {
    // Deliberately not put in the document, so it has no parent at all.
    const canvas = document.createElement('canvas')
    withContext2D(canvas)

    expect(() =>
      createAnimationCanvas(canvas, { draw: jest.fn(), relativeSize: true }),
    ).toThrow(/parent element/)
  })
})

describe('destroy', () => {
  test('cancels the pending frame', () => {
    const { instance, draw } = setup()

    frames.flush()
    const drawn = draw.mock.calls.length
    instance.destroy()

    expect(frames.pending()).toBe(0)
    frames.flush()
    expect(draw).toHaveBeenCalledTimes(drawn)
  })

  test('disconnects the observer', () => {
    const { instance } = setup({ relativeSize: true }, { withParent: true })

    instance.destroy()

    expect(resizeObserver.disconnected()).toBe(true)
  })
})
