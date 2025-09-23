import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  ReactElement,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react'

import { DrawingContext, drawingState, DrawingStateValue } from './canvas'

/*
TODO
AbsoluteSizingProps, RelativeSizingPropsの型付けを強くする
AbsoluteSizingPropsの場合、width, heightは必須
RelativeSizingPropsのの場合、relativeSizeは必須、reduceFlickeringはオプショナル
*/

function setDprConfig(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = width * dpr
  canvas.height = height * dpr
  // Reset current transformation matrix to the identity matrix
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(dpr, dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
}

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
  // TODO: saving scale and translate
  // context: Omit<CanvasRenderingContext2D, 'save' | 'restore' | 'scale'>,
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
  /**
   * @see https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext#contextattributes
   */
  options?: CanvasRenderingContext2DSettings
  init?: InitFunction
  draw: DrawFunction
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
  options,
  init,
  draw,
  // absolute
  width = 100,
  height = 100,
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
      reqIdRef.current = requestAnimationFrame(() =>
        loop(context, width, height, count + 1),
      )
      draw(context, {
        width: width.current,
        height: height.current,
        count: count + 1,
        deltaTime,
        elapsedTime,
        fps: 1000 / deltaTime,
      })
    },
    [draw],
  )

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', options)
    if (!context) throw new Error('Cannot get canvas context.')
    const dpr = globalThis.devicePixelRatio

    if (relativeSize) {
      const parent = canvas.parentElement
      if (!parent) throw new Error("Canvas doesn't have a parent element.")
      const memoCanvas = memoCanvasRef.current
      const memoContext = memoCanvas?.getContext('2d', options)

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // Prevents loss of some context when the canvas is resized
          const contextMemo = {} as DrawingContext
          for (const prop of drawingState) {
            ;(contextMemo[prop] as DrawingStateValue) = context[prop]
          }

          const w = entry.contentRect.width
          const h = entry.contentRect.height

          if (reduceFlickering && memoCanvas && memoContext) {
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

          for (const prop of drawingState) {
            ;(context[prop] as DrawingStateValue) = contextMemo[prop]
          }

          if (
            reduceFlickering &&
            memoContext &&
            memoCanvas &&
            memoCanvas.width > 0 &&
            memoCanvas.height > 0
          ) {
            context.drawImage(memoContext.canvas, 0, 0)
          }
        }
      })
      ro.observe(parent)

      const w = parent.clientWidth
      const h = parent.clientHeight
      setDprConfig(canvas, context, w, h, dpr)

      if (init)
        init(context, { width: widthRef.current, height: heightRef.current })
      const now = performance.now()
      deltaMemoRef.current = now
      startTimeRef.current = now
      loop(context, widthRef, heightRef, -1)

      return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
        ro.disconnect()
      }
    } else {
      const rect = canvas.getBoundingClientRect()
      setDprConfig(canvas, context, rect.width, rect.height, dpr)
      widthRef.current = rect.width
      heightRef.current = rect.height

      if (init)
        init(context, { width: widthRef.current, height: heightRef.current })
      const now = performance.now()
      deltaMemoRef.current = now
      startTimeRef.current = now
      loop(context, widthRef, heightRef, -1)

      return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
      }
    }
  }, [loop, init, options, reduceFlickering, relativeSize])

  return (
    <>
      <canvas
        className={clsx('tremolo-animation-canvas', className)}
        width={relativeSize ? 0 : width}
        height={relativeSize ? 0 : height}
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
