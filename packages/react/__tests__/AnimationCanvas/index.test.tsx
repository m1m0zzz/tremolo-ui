import { render, act } from '@testing-library/react'
import { useState } from 'react'

import { AnimationCanvas } from '../../src/components/AnimationCanvas'

/** jsdom has no 2D context and no ResizeObserver. */
function stubCanvas() {
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    let context = contexts.get(this)
    if (!context) {
      context = {
        setTransform: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
      } as unknown as CanvasRenderingContext2D
      contexts.set(this, context)
    }
    return context
  } as unknown as HTMLCanvasElement['getContext']
}

let flush: () => void

function stubAnimationFrame() {
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
  flush = () => {
    const callbacks = [...queued.values()]
    queued.clear()
    for (const callback of callbacks) callback(performance.now())
  }
}

beforeEach(() => {
  stubCanvas()
  stubAnimationFrame()
  globalThis.devicePixelRatio = 1
})

describe('AnimationCanvas', () => {
  test('a re-render does not restart the animation', () => {
    // `draw` is written inline at almost every call site, so it is a new
    // function on every render. Before the core took over, that tore the
    // canvas down and restarted the loop, resetting the frame count and
    // running init again.
    const counts: number[] = []
    const init = jest.fn()

    function Host() {
      const [, setTick] = useState(0)
      return (
        <>
          <button onClick={() => setTick((n) => n + 1)}>re-render</button>
          <AnimationCanvas
            width={100}
            height={100}
            init={init}
            draw={(_context, { count }) => counts.push(count)}
          />
        </>
      )
    }

    const { getByText } = render(<Host />)

    act(() => flush())
    act(() => flush())
    expect(counts).toEqual([0, 1])

    act(() => getByText('re-render').click())
    act(() => flush())

    expect(counts).toEqual([0, 1, 2])
    expect(init).toHaveBeenCalledTimes(1)
  })

  test('a re-render uses the latest draw handler', () => {
    function Host({ label }: { label: string }) {
      return (
        <AnimationCanvas
          width={10}
          height={10}
          draw={(context) => {
            context.fillStyle = label
          }}
        />
      )
    }

    const { container, rerender } = render(<Host label="first" />)
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D

    act(() => flush())
    expect(context.fillStyle).toBe('first')

    rerender(<Host label="second" />)
    act(() => flush())
    expect(context.fillStyle).toBe('second')
  })

  test('changing width resizes the canvas', () => {
    globalThis.devicePixelRatio = 2

    const { container, rerender } = render(
      <AnimationCanvas width={100} height={50} draw={() => {}} />,
    )
    const canvas = container.querySelector('canvas') as HTMLCanvasElement

    expect(canvas.width).toBe(200)
    expect(canvas.style.width).toBe('100px')

    rerender(<AnimationCanvas width={40} height={50} draw={() => {}} />)

    expect(canvas.width).toBe(80)
    expect(canvas.style.width).toBe('40px')
  })

  test('unmounting cancels the loop', () => {
    const draw = jest.fn()
    const { unmount } = render(
      <AnimationCanvas width={10} height={10} draw={draw} />,
    )

    act(() => flush())
    const drawn = draw.mock.calls.length
    unmount()
    act(() => flush())

    expect(draw).toHaveBeenCalledTimes(drawn)
  })
})
