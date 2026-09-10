import {
  applyDevicePixelRatio,
  readDrawingState,
  writeDrawingState,
  type DrawingContext,
} from './context'

/** What the canvas looked like when a frame was drawn. */
export interface AnimationFrame {
  /** Width of the canvas in CSS pixels. */
  width: number
  /** Height of the canvas in CSS pixels. */
  height: number
  /** Frames drawn so far, starting at 0. */
  count: number
  /** Milliseconds since the previous frame. */
  deltaTime: number
  /** Milliseconds since the instance was created. */
  elapsedTime: number
  /** Frames per second implied by `deltaTime`, or 0 when no time elapsed. */
  fps: number
}

export type CanvasDrawFunction = (
  context: CanvasRenderingContext2D,
  frame: AnimationFrame,
) => void

export type CanvasInitFunction = (
  context: CanvasRenderingContext2D,
  size: { width: number; height: number },
) => void

export interface AnimationCanvasOptions {
  /** Called for every frame. */
  draw: CanvasDrawFunction

  /** Called once, after the first size is known and before the first frame. */
  init?: CanvasInitFunction

  /**
   * Keep drawing on every animation frame. When off, a frame is drawn only on
   * a resize or an explicit {@link AnimationCanvasInstance.redraw}.
   *
   * @default true
   */
  animate?: boolean

  /**
   * Size in CSS pixels. Ignored when `relativeSize` is on.
   *
   * @default { width: 100, height: 100 }
   */
  size?: { width: number; height: number }

  /**
   * Follow the size of the canvas's parent element instead of `size`.
   *
   * Fixed for the lifetime of the instance: it decides whether a
   * `ResizeObserver` is attached.
   *
   * @default false
   */
  relativeSize?: boolean

  /**
   * Carry the drawing across a resize, so that the canvas does not blank for a
   * frame while the new size is drawn.
   *
   * @default true
   */
  reduceFlickering?: boolean

  /**
   * Passed to `getContext('2d', …)`. Read once when the context is created, so
   * it is fixed for the lifetime of the instance.
   *
   * @see https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext#contextattributes
   */
  contextAttributes?: CanvasRenderingContext2DSettings
}

export interface AnimationCanvasInstance {
  /**
   * Replace the given options. Lets a wrapper feed a fresh `draw` in on every
   * render without restarting the animation, so the frame count and the
   * elapsed time keep running.
   *
   * `relativeSize` and `contextAttributes` are fixed for the lifetime of the
   * instance and are ignored here.
   *
   * While `animate` is off this also draws a frame, since nothing else would.
   */
  update: (options: Partial<AnimationCanvasOptions>) => void

  /** Draw one frame now, whether or not `animate` is on. */
  redraw: () => void

  destroy: () => void
}

/**
 * Drive a canvas from `requestAnimationFrame`, keeping its backing store in
 * step with the device pixel ratio and, optionally, with the size of its
 * parent.
 *
 * Drawing code works in CSS pixels: the context is scaled by the device pixel
 * ratio, and `width` / `height` of each {@link AnimationFrame} are CSS pixels.
 */
export function createAnimationCanvas(
  canvas: HTMLCanvasElement,
  options: AnimationCanvasOptions,
): AnimationCanvasInstance {
  let opts = options

  const context2d = canvas.getContext('2d', opts.contextAttributes)
  if (!context2d) {
    throw new Error('createAnimationCanvas: cannot get a 2d context')
  }
  const context: CanvasRenderingContext2D = context2d

  const relativeSize = opts.relativeSize ?? false

  /** Off-document canvas holding the drawing while the real one is resized. */
  let memo: HTMLCanvasElement | null = null
  let memoContext: CanvasRenderingContext2D | null = null

  let width = 0
  let height = 0
  let appliedDpr = 0
  /** Whether a size has been applied, so a frame can be drawn. */
  let sized = false
  let initialized = false

  let frameId: number | null = null
  let count = -1
  const startTime = performance.now()
  let previousTime = startTime

  function devicePixelRatio() {
    return globalThis.devicePixelRatio || 1
  }

  /**
   * Copy the canvas onto the memo canvas at its full device resolution, 1:1.
   *
   * Assigning to `memo.width` resets the memo's transform to the identity, so
   * the copy neither scales nor resamples.
   */
  function takeSnapshot() {
    if (!(opts.reduceFlickering ?? true)) return false
    if (!memo) {
      memo = globalThis.document?.createElement('canvas') ?? null
      memoContext = memo?.getContext('2d', opts.contextAttributes) ?? null
    }
    if (!memo || !memoContext) return false

    memo.width = canvas.width
    memo.height = canvas.height
    if (canvas.width > 0 && canvas.height > 0) {
      memoContext.drawImage(canvas, 0, 0)
    }
    return true
  }

  /**
   * Put the snapshot back, given the size in CSS pixels it was taken at.
   *
   * The context is scaled to CSS pixels, so drawing the snapshot at its old
   * CSS size leaves it exactly where it was. While the device pixel ratio
   * stays put that is a 1:1 copy of device pixels, and when it changes the
   * snapshot is rescaled once, from its full resolution.
   */
  function restoreSnapshot(
    hasSnapshot: boolean,
    previousWidth: number,
    previousHeight: number,
  ) {
    if (!hasSnapshot || !memo) return
    if (memo.width <= 0 || memo.height <= 0) return
    context.drawImage(memo, 0, 0, previousWidth, previousHeight)
  }

  function applySize(w: number, h: number) {
    const dpr = devicePixelRatio()
    const previousWidth = width
    const previousHeight = height
    const previousDpr = appliedDpr
    const state: DrawingContext | null = sized
      ? readDrawingState(context)
      : null
    const hasSnapshot = sized && takeSnapshot()
    applyDevicePixelRatio(canvas, context, w, h, dpr)
    width = w
    height = h
    appliedDpr = dpr
    sized = true
    // Restore pixels while the reset context still has neutral alpha,
    // compositing, filter, and shadow settings.
    restoreSnapshot(hasSnapshot, previousWidth, previousHeight)
    if (state) {
      writeDrawingState(context, state, dpr / previousDpr)
    }
  }

  function applyDevicePixelRatioIfNeeded() {
    if (sized && devicePixelRatio() !== appliedDpr) {
      applySize(width, height)
    }
  }

  function drawFrame(timestamp = performance.now()) {
    if (!sized) return
    applyDevicePixelRatioIfNeeded()
    if (!initialized) {
      initialized = true
      opts.init?.(context, { width, height })
    }
    const deltaTime = timestamp - previousTime
    previousTime = timestamp
    count += 1
    opts.draw(context, {
      width,
      height,
      count,
      deltaTime,
      elapsedTime: timestamp - startTime,
      fps: deltaTime > 0 ? 1000 / deltaTime : 0,
    })
  }

  function tick(timestamp: DOMHighResTimeStamp) {
    // Scheduled before drawing so that a slow frame does not delay the next
    // request, matching how requestAnimationFrame loops are usually written.
    frameId = requestAnimationFrame(tick)
    drawFrame(timestamp)
  }

  function startLoop() {
    if (frameId !== null) return
    previousTime = performance.now()
    frameId = requestAnimationFrame(tick)
  }

  function stopLoop() {
    if (frameId === null) return
    cancelAnimationFrame(frameId)
    frameId = null
  }

  let observer: ResizeObserver | null = null

  if (relativeSize) {
    const parent = canvas.parentElement
    if (!parent) {
      throw new Error(
        'createAnimationCanvas: relativeSize needs the canvas to have a parent element',
      )
    }
    // The observer reports the current size as soon as it starts, so it is the
    // single source of the size — including the first one. Reading the parent
    // here instead would mix the padding box with the content box the observer
    // reports.
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w !== width || h !== height || devicePixelRatio() !== appliedDpr) {
          applySize(w, h)
        }
        // With the loop running the next frame covers the new size already.
        if (!(opts.animate ?? true)) drawFrame()
      }
    })
    observer.observe(parent)
  } else {
    const { width: w = 100, height: h = 100 } = opts.size ?? {}
    applySize(w, h)
  }

  if (opts.animate ?? true) {
    startLoop()
  } else if (sized) {
    drawFrame()
  }

  return {
    update: (next) => {
      const wasAnimating = opts.animate ?? true
      opts = {
        ...opts,
        ...next,
        relativeSize,
        contextAttributes: opts.contextAttributes,
      }

      if (!relativeSize) {
        const { width: w = 100, height: h = 100 } = opts.size ?? {}
        if (w !== width || h !== height) applySize(w, h)
      }
      applyDevicePixelRatioIfNeeded()

      const animating = opts.animate ?? true
      if (animating && !wasAnimating) startLoop()
      if (!animating && wasAnimating) stopLoop()

      // Without a loop running, a resize and this call are the only things
      // that can put anything new on the canvas — so a new `draw` has to be
      // painted here. That is what makes a canvas driven by state rather than
      // by time work: the wrapper re-renders, pushes the new handler in, and
      // the frame it draws reflects it.
      if (!animating) drawFrame()
    },
    redraw: drawFrame,
    destroy: () => {
      stopLoop()
      observer?.disconnect()
      observer = null
      memo = null
      memoContext = null
    },
  }
}
