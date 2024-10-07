import { css, CSSObject } from '@emotion/react'
import { MutableRefObject, useEffect, useRef } from 'react'

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
  options?: CanvasRenderingContext2DSettings
  style?: CSSObject
  init?: DrawFunc
  draw: DrawFunc
}

/**
 * A simple animatable canvas with requestAnimationFrame()
 */
export function AnimationCanvas({
  width,
  height,
  style,
  relativeSize = false,
  options,
  init,
  draw,
}: AnimationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    const context = canvas.getContext('2d', options) as CanvasRenderingContext2D
    const dpr = window.devicePixelRatio
    console.log(dpr)
    const rect = canvas.getBoundingClientRect()
    if (relativeSize) {
      const parent = canvas.parentElement
      if (!parent) {
        throw new Error("canvas doesn't have a parent element")
      }
      const resizeObserver = new ResizeObserver(() => {
        widthRef.current = canvas.width = Math.floor(
          (parent.clientWidth * (width ?? 100)) / 100,
        )
        heightRef.current = canvas.height = Math.floor(
          (parent.clientHeight * (height ?? 100)) / 100,
        )
      })
      resizeObserver.observe(parent)

      const w = Math.floor((parent.clientWidth * (width ?? 100)) / 100)
      const h = Math.floor((parent.clientHeight * (height ?? 100)) / 100)
      widthRef.current = canvas.width = w
      heightRef.current = canvas.height = h

      if (init) init(context, widthRef, heightRef, 0)
      loop(context, widthRef, heightRef, 0)

      return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
        if (resizeObserver) resizeObserver.unobserve(parent)
      }
    } else {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      context.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
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
    <canvas
      width={relativeSize ? 0 : width}
      height={relativeSize ? 0 : height}
      css={css(style)}
      ref={canvasRef}
    ></canvas>
  )
}
