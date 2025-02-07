import { css, CSSObject } from '@emotion/react'
import { ComponentPropsWithRef, MutableRefObject, ReactElement, useEffect, useRef } from 'react'
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

export type DrawFunction = (
  context: CanvasRenderingContext2D,
  width: MutableRefObject<number>,
  height: MutableRefObject<number>,
  count: number,
) => void

interface CommonProps {
  options?: CanvasRenderingContext2DSettings
  style?: CSSObject
  init?: DrawFunction
  draw: DrawFunction
}

interface AbsoluteSizingProps {
  width?: number
  height?: number
}

interface RelativeSizingProps {
  relativeSize?: boolean
  reduceFlickering?: boolean
}

export type AnimationCanvasProps = AbsoluteSizingProps & RelativeSizingProps & CommonProps

/**
 * A simple animatable canvas with requestAnimationFrame()
 */
export function AnimationCanvas(props: AbsoluteSizingProps & CommonProps): ReactElement
export function AnimationCanvas(props: RelativeSizingProps & CommonProps): ReactElement
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
  Omit<ComponentPropsWithRef<'canvas'>, keyof AnimationCanvasProps>): ReactElement {
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

      const resizeObserver = new ResizeObserver((entries) => {
        // TODO: If the parent element has no absolute height, the height increases infinitely.
        //     : 親要素に絶対的な高さを持たない場合、高さは無限に増加します。
        // https://zenn.dev/megeton/articles/be1c677e174c84#%E6%A0%B9%E6%9C%AC%E7%9A%84%E3%81%AB-resizeobserver-loop-limit-exceeded-%E3%81%8C%E5%87%BA%E3%82%8B%E5%95%8F%E9%A1%8C%E3%81%AB%E5%90%91%E3%81%8D%E5%90%88%E3%81%86
        for (const entry of entries) {
          // Prevents loss of some context when the canvas is resized
          const contextMemo = {} as DrawingContext
          for (const prop of drawingState) {
            (contextMemo[prop] as DrawingStateValue) = context[prop]
          }

          const w = Math.floor(entry.contentRect.width)
          const h = Math.floor(entry.contentRect.height)

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
          ref={memoCanvasRef}
        ></canvas>
      )}
    </>
  )
}
