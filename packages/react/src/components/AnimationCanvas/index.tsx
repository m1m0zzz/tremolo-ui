import { css, CSSObject } from '@emotion/react'
import { MutableRefObject, useEffect, useRef } from 'react'
import clsx from 'clsx'

import { DrawingContext, drawingState, DrawingStateValue } from './canvas'

function setDprConfig(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = width * dpr
  canvas.height = height * dpr
  context.scale(dpr, dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
}

type DrawFunc = (
  context: CanvasRenderingContext2D,
  width: MutableRefObject<number>,
  height: MutableRefObject<number>,
  count: number,
) => void

interface AnimationCanvasProps {
  width?: number
  height?: number
  relativeSize?: boolean
  /** only available relativeSize=true */
  reduceFlickering?: boolean
  options?: CanvasRenderingContext2DSettings
  style?: CSSObject
  init?: DrawFunc
  draw: DrawFunc
}

/**
 * A simple animatable canvas with requestAnimationFrame()
 */
export function AnimationCanvas({
  width = 100,
  height = 100,
  style,
  relativeSize = false,
  reduceFlickering = true,
  options,
  init,
  draw,
  className,
  ...props
}: AnimationCanvasProps &
  Omit<
    React.ClassAttributes<HTMLCanvasElement> &
      React.CanvasHTMLAttributes<HTMLCanvasElement>,
    'ref' | 'width' | 'height' | 'style'
  >) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const memoCanvasRef = useRef<HTMLCanvasElement>(null)
  const reqIdRef = useRef<number>()
  const widthRef = useRef(0)
  const heightRef = useRef(0)

  const loop = (
    context: CanvasRenderingContext2D,
    width: MutableRefObject<number>,
    height: MutableRefObject<number>,
    count: number,
  ) => {
    reqIdRef.current = requestAnimationFrame(() =>
      loop(context, width, height, count + 1),
    )
    draw(context, width, height, count + 1)
  }

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', options)
    if (!context) throw new Error('Cannot get canvas context.')
    const dpr = window.devicePixelRatio

    if (relativeSize) {
      const parent = canvas.parentElement
      if (!parent) throw new Error("Canvas doesn't have a parent element.")
      const memoCanvas = memoCanvasRef.current
      const memoContext = memoCanvas?.getContext('2d', options)

      const resizeObserver = new ResizeObserver(() => {
        console.log('resize')
        // Prevents loss of some context when the canvas is resized
        const contextMemo = {} as DrawingContext
        for (const prop of drawingState) {
          (contextMemo[prop] as DrawingStateValue) = context[prop]
        }

        const w = Math.floor(parent.clientWidth)
        const h = Math.floor(parent.clientHeight)

        if (reduceFlickering && memoCanvas && memoContext) {
          memoCanvas.width = w * dpr
          memoCanvas.height = h * dpr
          memoContext.scale(1 / dpr, 1 / dpr)
          memoContext.drawImage(context.canvas, 0, 0)
        }

        setDprConfig(canvas, context, w, h, dpr)
        widthRef.current = w
        heightRef.current = h

        for (const prop of drawingState) {
          (context[prop] as DrawingStateValue) = contextMemo[prop]
        }

        if (reduceFlickering && memoContext) {
          context.drawImage(memoContext.canvas, 0, 0)
        }
      })
      resizeObserver.observe(parent)

      const w = Math.floor(parent.clientWidth)
      const h = Math.floor(parent.clientHeight)
      setDprConfig(canvas, context, w, h, dpr)

      if (init) init(context, widthRef, heightRef, 0)
      loop(context, widthRef, heightRef, 0)

      return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
        resizeObserver.unobserve(parent)
      }
    } else {
      const rect = canvas.getBoundingClientRect()
      setDprConfig(canvas, context, rect.width, rect.height, dpr)
      widthRef.current = rect.width
      heightRef.current = rect.height

      if (init) init(context, widthRef, heightRef, 0)
      loop(context, widthRef, heightRef, 0)

      return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
      }
    }
  }, [loop])

  return (
    <>
      <canvas
        className={clsx('tremolo-animation-canvas', className)}
        width={relativeSize ? 0 : width}
        height={relativeSize ? 0 : height}
        css={css(style)}
        ref={canvasRef}
        {...props}
      ></canvas>
      {relativeSize && reduceFlickering && (
        <canvas
          style={{ display: 'none' }}
          width={relativeSize ? 0 : width}
          height={relativeSize ? 0 : height}
          ref={memoCanvasRef}
        ></canvas>
      )}
    </>
  )
}
