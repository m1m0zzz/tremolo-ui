/**
 * jsdom has neither a 2D context nor a ResizeObserver, so both are faked here.
 */

/** The calls a test needs to see; everything else is a no-op spy. */
export type FakeContext = CanvasRenderingContext2D & {
  setTransform: jest.Mock
  scale: jest.Mock
  drawImage: jest.Mock
}

/**
 * Give every canvas a 2D context. Returns the context of the canvas passed in,
 * and installs the stub on the prototype so canvases made later get one too.
 */
export function withContext2D(canvas?: HTMLCanvasElement): FakeContext {
  const contexts = new WeakMap<HTMLCanvasElement, FakeContext>()

  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    let context = contexts.get(this)
    if (!context) {
      context = createFakeContext()
      contexts.set(this, context)
    }
    return context
  } as unknown as HTMLCanvasElement['getContext']

  return canvas ? (canvas.getContext('2d') as FakeContext) : createFakeContext()
}

function createFakeContext(): FakeContext {
  return {
    setTransform: jest.fn(),
    scale: jest.fn(),
    drawImage: jest.fn(),
    // The drawing state the resize path copies back and forth.
    strokeStyle: '#000000',
    fillStyle: '#000000',
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    lineDashOffset: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'inherit',
    imageSmoothingEnabled: true,
  } as unknown as FakeContext
}

export type ResizeObserverControl = {
  /** Report a new content box for everything being observed. */
  resize: (width: number, height: number) => void
  /** Elements currently observed. */
  observed: () => Element[]
  disconnected: () => boolean
}

/**
 * Install a ResizeObserver that reports nothing until a test asks it to, so
 * the initial delivery a real one makes is under the test's control.
 */
export function withResizeObserver(): ResizeObserverControl {
  let callback: ResizeObserverCallback | null = null
  const observed: Element[] = []
  let disconnected = false

  class FakeResizeObserver {
    constructor(cb: ResizeObserverCallback) {
      callback = cb
    }
    observe(element: Element) {
      observed.push(element)
    }
    unobserve() {}
    disconnect() {
      disconnected = true
    }
  }

  globalThis.ResizeObserver =
    FakeResizeObserver as unknown as typeof ResizeObserver

  return {
    resize: (width, height) => {
      const entries = observed.map(
        (target) =>
          ({
            target,
            contentRect: { width, height } as DOMRectReadOnly,
          }) as ResizeObserverEntry,
      )
      callback?.(entries, {} as ResizeObserver)
    },
    observed: () => observed,
    disconnected: () => disconnected,
  }
}

export type AnimationFrameControl = {
  /** Run everything queued now. Callbacks that re-queue land in the next flush. */
  flush: () => void
  /** How many callbacks are waiting. */
  pending: () => number
}

/**
 * Replace requestAnimationFrame with a queue the test drives, so a frame
 * happens exactly when the test says so.
 */
export function withAnimationFrame(): AnimationFrameControl {
  let nextId = 1
  const queued = new Map<number, FrameRequestCallback>()

  globalThis.requestAnimationFrame = (callback) => {
    const id = nextId++
    queued.set(id, callback)
    return id
  }
  globalThis.cancelAnimationFrame = (id) => {
    queued.delete(id)
  }

  return {
    flush: () => {
      const callbacks = [...queued.values()]
      queued.clear()
      for (const callback of callbacks) callback(performance.now())
    },
    pending: () => queued.size,
  }
}
