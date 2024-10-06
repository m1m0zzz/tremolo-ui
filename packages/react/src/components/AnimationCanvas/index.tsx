import { css, CSSObject } from '@emotion/react'
import { useEffect, useRef } from 'react'

type DrawFunc = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
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
    count: number,
  ) => {
    reqIdRef.current = requestAnimationFrame(() =>
      loop(context, width, height, count + 1),
    )
    draw(context, width, height, count + 1)
  }

  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext(
      '2d',
    ) as CanvasRenderingContext2D
    let w: number, h: number
    if (relativeSize) {
      const parentWidth = canvasRef.current.parentElement?.clientWidth ?? 0
      const parentHeight = canvasRef.current.parentElement?.clientHeight ?? 0
      w = Math.floor((parentWidth * (width ?? 100)) / 100)
      h = Math.floor((parentHeight * (height ?? 100)) / 100)
      canvasRef.current.width = w
      canvasRef.current.height = h
    } else {
      w = canvasRef.current.width
      h = canvasRef.current.height
    }
    if (init) init(context, w, h, 0)
    loop(context, w, h, 0)

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
