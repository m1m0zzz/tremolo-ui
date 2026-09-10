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
  type Context2DControl,
  type ResizeObserverControl,
} from './helpers'

import type { Mock } from 'vitest'

const instances: { destroy: () => void }[] = []

let frames: AnimationFrameControl
let context2D: Context2DControl
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
  const draw = vi.fn()
  const init = vi.fn()

  const instance = createAnimationCanvas(canvas, {
    draw,
    init,
    ...options,
  })
  instances.push(instance)
  const context = context2D.get(canvas)

  return { canvas, parent, context, draw, init, instance }
}

/** The frame passed to the last call of a draw handler. */
function lastFrame(draw: Mock): AnimationFrame {
  return draw.mock.calls[draw.mock.calls.length - 1][1]
}

beforeEach(() => {
  context2D = withContext2D()
  frames = withAnimationFrame()
  resizeObserver = withResizeObserver()
  globalThis.devicePixelRatio = 1
})

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
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

  test('reports timing from the animation frame timestamp', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { draw } = setup()

    frames.flush(1016)
    expect(lastFrame(draw)).toMatchObject({
      deltaTime: 16,
      elapsedTime: 16,
      fps: 62.5,
    })

    frames.flush(1048)
    expect(lastFrame(draw)).toMatchObject({
      deltaTime: 32,
      elapsedTime: 48,
      fps: 31.25,
    })
  })

  test('throws a clear error when a 2D context is unavailable', () => {
    const canvas = document.createElement('canvas')
    canvas.getContext = vi.fn(() => null)

    expect(() => createAnimationCanvas(canvas, { draw: vi.fn() })).toThrow(
      'createAnimationCanvas: cannot get a 2d context',
    )
  })

  test('keeps the original contextAttributes after an update', () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    const contextAttributes = { alpha: false }
    const canvas = document.createElement('canvas')
    const instance = createAnimationCanvas(canvas, {
      draw: vi.fn(),
      contextAttributes,
    })
    instances.push(instance)

    expect(getContext).toHaveBeenCalledTimes(1)
    expect(getContext).toHaveBeenCalledWith('2d', contextAttributes)

    instance.update({
      contextAttributes: { alpha: true },
      size: { width: 200, height: 100 },
    })
    expect(getContext).toHaveBeenCalledTimes(2)
    expect(getContext).toHaveBeenLastCalledWith('2d', contextAttributes)
  })

  test('keeps requesting the next frame while animating', () => {
    setup()
    expect(frames.pending()).toBe(1)
    frames.flush()
    expect(frames.pending()).toBe(1)
  })

  test('follows devicePixelRatio changes on the next animation frame', () => {
    const { canvas } = setup({ size: { width: 80, height: 40 } })

    globalThis.devicePixelRatio = 2
    frames.flush()

    expect(canvas.width).toBe(160)
    expect(canvas.height).toBe(80)
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

    const next = vi.fn()
    instance.update({ draw: next })
    frames.flush()

    expect(next).toHaveBeenCalledTimes(1)
    expect(lastFrame(next).count).toBe(2)
    expect(draw).toHaveBeenCalledTimes(2)
  })

  test('swapping the handler does not run init again', () => {
    const { instance, init } = setup()

    frames.flush()
    instance.update({ draw: vi.fn() })
    frames.flush()

    expect(init).toHaveBeenCalledTimes(1)
  })

  test('elapsedTime keeps running and deltaTime restarts after pausing', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { instance } = setup()

    frames.flush(1016)
    now.mockReturnValue(1100)
    instance.update({ animate: false })

    const next = vi.fn()
    now.mockReturnValue(2000)
    instance.update({ animate: true, draw: next })
    frames.flush(2010)

    expect(lastFrame(next).elapsedTime).toBe(1010)
    expect(lastFrame(next).deltaTime).toBe(10)
    expect(lastFrame(next).fps).toBe(100)
  })

  test('turning animate off stops the loop, turning it on starts it', () => {
    const { instance, draw } = setup()

    frames.flush()
    const drawn = draw.mock.calls.length

    instance.update({ animate: false })
    // Turning it off paints once, then nothing is scheduled.
    expect(draw).toHaveBeenCalledTimes(drawn + 1)
    frames.flush()
    expect(frames.pending()).toBe(0)
    expect(draw).toHaveBeenCalledTimes(drawn + 1)

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

  test('re-applies the backing size when only devicePixelRatio changes', () => {
    const { canvas, instance } = setup({ size: { width: 100, height: 50 } })

    globalThis.devicePixelRatio = 2
    instance.update({ draw: vi.fn() })

    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(100)
  })
})

describe('animate: false', () => {
  test('draws once and schedules nothing', () => {
    const { draw } = setup({ animate: false })

    expect(draw).toHaveBeenCalledTimes(1)
    expect(frames.pending()).toBe(0)
  })

  test('reports a finite fps when no time has elapsed', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { draw } = setup({ animate: false })

    expect(lastFrame(draw).deltaTime).toBe(0)
    expect(lastFrame(draw).fps).toBe(0)
  })

  // The "reactive canvas" pattern: state drives the drawing and a re-render is
  // what asks for a repaint. Without a loop running, update() is the only
  // thing that can put the new drawing on the canvas.
  test('update draws a frame, so a new handler reaches the canvas', () => {
    const { instance, draw } = setup({ animate: false })

    expect(draw).toHaveBeenCalledTimes(1)

    const next = vi.fn()
    instance.update({ draw: next })

    expect(next).toHaveBeenCalledTimes(1)
    expect(lastFrame(next).count).toBe(1)
  })

  test('update keeps drawing on every call while not animating', () => {
    const { instance, draw } = setup({ animate: false })

    instance.update({ draw })
    instance.update({ draw })

    expect(draw).toHaveBeenCalledTimes(3)
  })

  test('update does not draw an extra frame while animating', () => {
    const { instance, draw } = setup()

    frames.flush()
    const drawn = draw.mock.calls.length
    instance.update({ draw })

    expect(draw).toHaveBeenCalledTimes(drawn)
  })

  test('redraw() draws another frame', () => {
    const { instance, draw } = setup({ animate: false })

    instance.redraw()

    expect(draw).toHaveBeenCalledTimes(2)
    expect(lastFrame(draw).count).toBe(1)
  })

  test('redraw() follows a devicePixelRatio change', () => {
    const { canvas, instance } = setup({
      animate: false,
      size: { width: 80, height: 40 },
    })

    globalThis.devicePixelRatio = 2
    instance.redraw()

    expect(canvas.width).toBe(160)
    expect(canvas.height).toBe(80)
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
    const { canvas, context } = setup(
      { relativeSize: true },
      { withParent: true },
    )

    resizeObserver.resize(100, 100)
    resizeObserver.resize(120, 100)

    const [[memo, ...placement]] = context.drawImage.mock.calls
    expect(
      context2D.get(memo as HTMLCanvasElement).drawImage,
    ).toHaveBeenCalledWith(canvas, 0, 0)
    expect(placement).toEqual([0, 0, 100, 100])
  })

  test('restores drawing state even when reduceFlickering is off', () => {
    const init = (context: CanvasRenderingContext2D) => {
      context.fillStyle = '#123456'
      context.globalAlpha = 0.4
      context.lineWidth = 3
      context.filter = 'blur(2px)'
      context.setLineDash([4, 2])
      context.translate(5, 7)
    }
    const { context } = setup(
      { relativeSize: true, reduceFlickering: false, init },
      { withParent: true },
    )

    resizeObserver.resize(100, 100)
    frames.flush()
    resizeObserver.resize(120, 100)

    expect(context.fillStyle).toBe('#123456')
    expect(context.globalAlpha).toBe(0.4)
    expect(context.lineWidth).toBe(3)
    expect(context.filter).toBe('blur(2px)')
    expect(context.getLineDash()).toEqual([4, 2])
    expect(context.getTransform()).toMatchObject({
      a: 1,
      d: 1,
      e: 5,
      f: 7,
    })
  })

  test('restores a snapshot before the caller drawing state', () => {
    const { context } = setup({ relativeSize: true }, { withParent: true })
    resizeObserver.resize(100, 100)
    context.globalAlpha = 0.4
    context.globalCompositeOperation = 'destination-out'
    context.shadowBlur = 8

    let stateWhileRestoring: Partial<CanvasRenderingContext2D> = {}
    context.drawImage.mockImplementation(() => {
      stateWhileRestoring = {
        globalAlpha: context.globalAlpha,
        globalCompositeOperation: context.globalCompositeOperation,
        shadowBlur: context.shadowBlur,
      }
    })
    resizeObserver.resize(120, 100)

    expect(stateWhileRestoring).toEqual({
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowBlur: 0,
    })
    expect(context.globalAlpha).toBe(0.4)
    expect(context.globalCompositeOperation).toBe('destination-out')
    expect(context.shadowBlur).toBe(8)
  })

  test('rescales the current transform with devicePixelRatio', () => {
    const init = (context: CanvasRenderingContext2D) => {
      context.translate(5, 7)
    }
    const { context } = setup(
      { relativeSize: true, init },
      { withParent: true },
    )

    resizeObserver.resize(100, 100)
    frames.flush()
    globalThis.devicePixelRatio = 2
    frames.flush()

    expect(context.getTransform()).toMatchObject({
      a: 2,
      d: 2,
      e: 10,
      f: 14,
    })
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
    context2D.get(canvas)

    expect(() =>
      createAnimationCanvas(canvas, { draw: vi.fn(), relativeSize: true }),
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
