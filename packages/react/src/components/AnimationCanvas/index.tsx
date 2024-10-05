import { css, CSSObject } from '@emotion/react'
import { useEffect, useRef } from 'react'

type DrawFunc = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => void

interface AnimationCanvasProps {
  width?: number
  height?: number
  relativeSize?: boolean
  style?: CSSObject
  init?: DrawFunc
  draw: DrawFunc
}

export function AnimationCanvas({
  width,
  height,
  style,
  relativeSize = false,
  init,
  draw,
}: AnimationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reqIdRef = useRef<number>()

  const loop = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    reqIdRef.current = requestAnimationFrame(() => loop(context, width, height))
    draw(context, width, height)
  }

  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext(
      '2d',
    ) as CanvasRenderingContext2D
    let w: number, h: number
    if (relativeSize) {
      console.log(canvasRef.current.parentElement)
      console.log(canvasRef.current.parentElement?.clientWidth)
      console.log(canvasRef.current.parentElement?.clientHeight)
      w = Math.floor(
        ((canvasRef.current.parentElement?.clientWidth ?? 0) * (width ?? 100)) /
          100,
      )
      h = Math.floor(
        ((canvasRef.current.parentElement?.clientHeight ?? 0) *
          (height ?? 100)) /
          100,
      )
      canvasRef.current.width = w
      canvasRef.current.height = h
    }
    w = canvasRef.current.width
    h = canvasRef.current.height
    if (init) init(context, w, h)
    loop(context, w, h)

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)
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
