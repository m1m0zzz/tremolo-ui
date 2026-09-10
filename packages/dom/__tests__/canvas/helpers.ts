/**
 * jsdom has neither a 2D context nor a ResizeObserver, so both are faked here.
 */

import type { Mock } from 'vitest'

/** The calls a test needs to see; everything else is a no-op spy. */
export type FakeContext = CanvasRenderingContext2D & {
  setTransform: Mock
  scale: Mock
  drawImage: Mock
}

export type Context2DControl = {
  get: (canvas: HTMLCanvasElement) => FakeContext
}

/**
 * Give every canvas a 2D context and reset its state when its backing size is
 * assigned, as a browser does.
 */
export function withContext2D(): Context2DControl {
  const contexts = new WeakMap<HTMLCanvasElement, ResettableFakeContext>()
  const instrumented = new WeakSet<HTMLCanvasElement>()
  const width = Object.getOwnPropertyDescriptor(
    HTMLCanvasElement.prototype,
    'width',
  )
  const height = Object.getOwnPropertyDescriptor(
    HTMLCanvasElement.prototype,
    'height',
  )

  function instrumentSize(canvas: HTMLCanvasElement) {
    if (instrumented.has(canvas)) return
    instrumented.add(canvas)
    for (const [property, descriptor] of [
      ['width', width],
      ['height', height],
    ] as const) {
      Object.defineProperty(canvas, property, {
        configurable: true,
        get: descriptor?.get,
        set(value: number) {
          descriptor?.set?.call(this, value)
          contexts.get(this)?.reset()
        },
      })
    }
  }

  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    let context = contexts.get(this)
    if (!context) {
      context = createFakeContext()
      contexts.set(this, context)
      instrumentSize(this)
    }
    return context
  } as unknown as HTMLCanvasElement['getContext']

  return {
    get: (canvas) => canvas.getContext('2d') as FakeContext,
  }
}

type ResettableFakeContext = FakeContext & { reset: () => void }

function createFakeContext(): ResettableFakeContext {
  let transform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  let lineDash: number[] = []
  let context: ResettableFakeContext

  const reset = () => {
    transform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
    lineDash = []
    Object.assign(context, {
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
      filter: 'none',
      font: '10px sans-serif',
      fontKerning: 'auto',
      fontStretch: 'normal',
      fontVariantCaps: 'normal',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      direction: 'inherit',
      letterSpacing: '0px',
      textRendering: 'auto',
      wordSpacing: '0px',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'low',
    })
  }

  context = {
    reset,
    setTransform: vi.fn(
      (
        ...args:
          | [DOMMatrix2DInit]
          | [number, number, number, number, number, number]
      ) => {
        if (args.length === 1) {
          const value = args[0]
          transform = {
            a: value.a ?? value.m11 ?? 1,
            b: value.b ?? value.m12 ?? 0,
            c: value.c ?? value.m21 ?? 0,
            d: value.d ?? value.m22 ?? 1,
            e: value.e ?? value.m41 ?? 0,
            f: value.f ?? value.m42 ?? 0,
          }
        } else {
          const [a, b, c, d, e, f] = args
          transform = { a, b, c, d, e, f }
        }
      },
    ),
    getTransform: vi.fn(() => ({ ...transform }) as DOMMatrix),
    scale: vi.fn((x: number, y: number) => {
      transform = {
        a: transform.a * x,
        b: transform.b * x,
        c: transform.c * y,
        d: transform.d * y,
        e: transform.e,
        f: transform.f,
      }
    }),
    translate: vi.fn((x: number, y: number) => {
      transform = {
        ...transform,
        e: transform.a * x + transform.c * y + transform.e,
        f: transform.b * x + transform.d * y + transform.f,
      }
    }),
    setLineDash: vi.fn((segments: number[]) => {
      lineDash = [...segments]
    }),
    getLineDash: vi.fn(() => [...lineDash]),
    drawImage: vi.fn(),
  } as unknown as ResettableFakeContext
  reset()
  return context
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
  flush: (timestamp?: DOMHighResTimeStamp) => void
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
    flush: (timestamp = performance.now()) => {
      const callbacks = [...queued.values()]
      queued.clear()
      for (const callback of callbacks) callback(timestamp)
    },
    pending: () => queued.size,
  }
}
