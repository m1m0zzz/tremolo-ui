import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  ReactElement,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react'

import {
  DrawingContext,
  drawingState,
  DrawingStateValue,
  setDprConfig,
} from './canvas'

/** @category AnimationCanvas */
export type InitFunction = (
  context: CanvasRenderingContext2D,
  option: {
    /** current canvas width */
    width: number
    /** current canvas height */
    height: number
  },
) => void

/** @category AnimationCanvas */
export type DrawFunction = (
  context: CanvasRenderingContext2D,
  option: {
    /** current canvas width */
    width: number
    /** current canvas height */
    height: number
    /** frame count */
    count: number
    /** delta time (ms) */
    deltaTime: number
    /** elapsed time (ms) */
    elapsedTime: number
    /** frame per second */
    fps: number
  },
) => void

/** @category AnimationCanvas */
export interface CommonProps {
  draw: DrawFunction
  init?: InitFunction
  animate?: boolean
  /**
   * @see https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext#contextattributes
   */
  options?: CanvasRenderingContext2DSettings
}

/** @category AnimationCanvas */
export interface AbsoluteSizingProps {
  width?: number
  height?: number
}

/** @category AnimationCanvas */
export interface RelativeSizingProps {
  relativeSize?: boolean
  reduceFlickering?: boolean
}

/** @category AnimationCanvas */
export type AnimationCanvasProps = CommonProps &
  AbsoluteSizingProps &
  RelativeSizingProps

/**
 * A simple animatable canvas with requestAnimationFrame()
 * @category AnimationCanvas
 */
export function AnimationCanvas(
  props: CommonProps &
    AbsoluteSizingProps &
    Omit<ComponentPropsWithoutRef<'canvas'>, keyof AnimationCanvasProps>,
): ReactElement
export function AnimationCanvas(
  pros: CommonProps &
    RelativeSizingProps &
    Omit<ComponentPropsWithoutRef<'canvas'>, keyof AnimationCanvasProps>,
): ReactElement
export function AnimationCanvas({
  // common
  draw,
  init,
  animate = true,
  options,
  // absolute
  width: _width = 100,
  height: _height = 100,
  // relative
  relativeSize,
  reduceFlickering = true,
  // canvas props
  className,
  onContextMenu = (event) => event.preventDefault(),
  ...props
}: AnimationCanvasProps &
  Omit<
    ComponentPropsWithoutRef<'canvas'>,
    keyof AnimationCanvasProps
  >): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const memoCanvasRef = useRef<HTMLCanvasElement>(null)
  const reqIdRef = useRef(-1)
  const widthRef = useRef(0)
  const heightRef = useRef(0)
  const deltaMemoRef = useRef(-1)
  const startTimeRef = useRef(-1)

  const loop = useCallback(
    (
      context: CanvasRenderingContext2D,
      width: RefObject<number>,
      height: RefObject<number>,
      count: number,
    ) => {
      const now = performance.now()
      const deltaTime = now - deltaMemoRef.current
      const elapsedTime = now - startTimeRef.current
      deltaMemoRef.current = now
      if (animate) {
        reqIdRef.current = requestAnimationFrame(() =>
          loop(context, width, height, count + 1),
        )
      }
      draw(context, {
        width: width.current,
        height: height.current,
        count: count + 1,
        deltaTime,
        elapsedTime,
        fps: 1000 / deltaTime,
      })
    },
    [draw, animate],
  )

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', options)
    if (!context) throw new Error('Cannot get canvas context.')
    const dpr = globalThis.devicePixelRatio

    const firstRendering = (width: number, height: number) => {
      setDprConfig(canvas, context, width, height, dpr)
      widthRef.current = width
      heightRef.current = height

      if (init) init(context, { width, height })
      const now = performance.now()
      deltaMemoRef.current = now
      startTimeRef.current = now
      loop(context, widthRef, heightRef, -1)
    }

    if (relativeSize) {
      const parent = canvas.parentElement
      if (!parent) throw new Error("Canvas doesn't have a parent element.")
      const memoCanvas = memoCanvasRef.current
      const memoContext = memoCanvas?.getContext('2d', options)

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width
          const h = entry.contentRect.height
          const contextMemo = {} as DrawingContext
          if (reduceFlickering && memoCanvas && memoContext) {
            // Prevents loss of some context when the canvas is resized
            for (const prop of drawingState) {
              ;(contextMemo[prop] as DrawingStateValue) = context[prop]
            }
            memoCanvas.width = w * dpr
            memoCanvas.height = h * dpr
            memoContext.scale(1 / dpr, 1 / dpr)
            if (canvas.width > 0 && canvas.height > 0) {
              memoContext.drawImage(canvas, 0, 0)
            }
          }

          setDprConfig(canvas, context, w, h, dpr)
          widthRef.current = w
          heightRef.current = h

          if (
            reduceFlickering &&
            memoContext &&
            memoCanvas &&
            memoCanvas.width > 0 &&
            memoCanvas.height > 0
          ) {
            for (const prop of drawingState) {
              ;(context[prop] as DrawingStateValue) = contextMemo[prop]
            }

            context.drawImage(memoContext.canvas, 0, 0)
          }

          if (!animate) {
            // re rendering
            loop(context, widthRef, heightRef, -1)
          }
        }
      })
      ro.observe(parent)

      const width = parent.clientWidth
      const height = parent.clientHeight
      firstRendering(width, height)

      return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
        ro.disconnect()
      }
    } else {
      const { width, height } = canvas.getBoundingClientRect()
      firstRendering(width, height)

      return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
      }
    }
  }, [loop, init, options, reduceFlickering, relativeSize, animate])

  return (
    <>
      <canvas
        className={clsx('tremolo-animation-canvas', className)}
        width={relativeSize ? 0 : _width}
        height={relativeSize ? 0 : _height}
        ref={canvasRef}
        onContextMenu={onContextMenu}
        {...props}
      ></canvas>
      {relativeSize && reduceFlickering && (
        <canvas style={{ display: 'none' }} ref={memoCanvasRef}></canvas>
      )}
    </>
  )
}
