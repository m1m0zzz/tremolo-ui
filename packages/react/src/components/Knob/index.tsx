import { css, Global } from '@emotion/react'
import { clamp, normalizeValue, radian, rawValue, stepValue } from 'common/math'
import { WheelOption } from 'common/types'
import { useEffect, useRef } from 'react'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'

interface KnobProps {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // | SkewFunction
  size?: number | string
  width?: number | string
  height?: number | string
  options?: {
    active?: string
    inactive?: string
    bg?: string
    thumb?: string
    lineWeight?: number
    thumbWeight?: number
  }
  draw?: (
    context: CanvasRenderingContext2D,
    value: number,
    w?: number,
    h?: number,
  ) => void
  cursor?: string
  style?: React.CSSProperties
  bodyNoSelect?: boolean
  enableWheel?: WheelOption
  onChange?: (value: number) => void
}

const defaultOptions = {
  active: '#7998ec',
  inactive: '#eee',
  bg: '#ccc',
  thumb: '#4e76e6',
  lineWeight: 6,
  thumbWeight: 4,
}

export function Knob({
  value,
  min,
  max,
  step = 1,
  skew = 1,
  size,
  width,
  height,
  options = defaultOptions,
  draw,
  cursor = 'pointer',
  style,
  bodyNoSelect = true,
  enableWheel,
  onChange,
}: KnobProps) {
  // -- state and ref ---
  // const [privateValue, setPrivateValue] = useState(value);
  const dragOffsetY = useRef<number | undefined>(undefined)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // --- interpret props ---
  const opts = { ...defaultOptions, ...options }
  const defaultSize = 50
  // const percent = normalizeValue(value, min, max, skew)

  const handleValue = (
    event: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (dragOffsetY.current) {
      if (bodyNoSelect) document.body.classList.add('no-select')
      const delta = dragOffsetY.current - event.screenY
      dragOffsetY.current = event.screenY
      const n = normalizeValue(value, min, max, skew)
      const v = rawValue(n + delta / 100, min, max, skew)
      const v2 = clamp(stepValue(v, step), min, max)
      if (onChange) onChange(v2)
    }
  }

  // --- hooks ---
  const wrapperRef = useRefCallbackEvent(
    'wheel',
    (event) => {
      if (!enableWheel) return
      event.preventDefault()
      const x = event.deltaY > 0 ? -enableWheel[1] : enableWheel[1]
      let v
      if (enableWheel[0] == 'normalized') {
        const n = normalizeValue(value, min, max, skew)
        v = rawValue(n + x, min, max, skew)
      } else {
        v = value + x
      }
      if (onChange) onChange(clamp(stepValue(v, step), min, max))
    },
    { passive: false },
    [value],
  )

  useEventListener(window, 'mousemove', (event) => {
    handleValue(event)
  })

  useEventListener(window, 'mouseup', () => {
    dragOffsetY.current = undefined
    if (bodyNoSelect) document.body.classList.remove('no-select')
  })

  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext(
      '2d',
    ) as CanvasRenderingContext2D
    const w = canvasRef.current.width
    const h = canvasRef.current.height
    if (draw) {
      draw(context, value, w, h)
    } else {
      // draw default
      const p = normalizeValue(value, min, max, skew)
      const cx = w / 2
      const cy = h / 2
      const r = cx
      // reset
      context.clearRect(0, 0, w, h)
      context.lineCap = 'butt'
      // bg
      context.beginPath()
      context.fillStyle = opts.bg
      context.arc(cx, cy, r - 0.5, 0, 2 * Math.PI)
      context.fill()
      // active rotary
      context.lineWidth = opts.lineWeight
      if (p > 0) {
        context.beginPath()
        context.strokeStyle = opts.active
        context.arc(
          cx,
          cy,
          r - 0.5 - opts.lineWeight / 2,
          radian(135),
          radian(135 + 270 * p),
          false,
        )
        context.stroke()
      }
      // inactive rotary
      if (p < 1) {
        context.beginPath()
        context.strokeStyle = opts.inactive
        context.arc(
          cx,
          cy,
          cx - 0.5 - opts.lineWeight / 2,
          radian(135 + 270 * p),
          radian(45),
          false,
        )
        context.stroke()
      }
      // thumb
      context.beginPath()
      context.moveTo(cx, cy)
      context.lineTo(
        cx + Math.cos(radian(135 + 270 * p)) * (r - 0.5 - opts.thumbWeight / 2),
        cy + Math.sin(radian(135 + 270 * p)) * (r - 0.5 - opts.thumbWeight / 2),
      )
      context.strokeStyle = opts.thumb
      context.lineWidth = opts.thumbWeight
      context.lineCap = 'round'
      context.stroke()
    }
  }, [value, min, max, skew])

  return (
    <div
      className="tremolo-knob"
      ref={wrapperRef}
      role="slider"
      tabIndex={0}
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuemin={min}
      css={css({
        display: 'inline-block',
        width: size ?? width ?? defaultSize,
        height: size ?? height ?? defaultSize,
        position: 'relative',
        cursor: cursor,
        ...style,
      })}
      onMouseDown={(event) => {
        dragOffsetY.current = event.screenY
        handleValue(event)
      }}
    >
      <Global
        styles={{
          '.no-select': {
            userSelect: 'none',
          },
        }}
      />
      <canvas
        ref={canvasRef}
        width={size ?? width ?? defaultSize}
        height={size ?? height ?? defaultSize}
        css={css({
          background: '#0000',
        })}
      ></canvas>
    </div>
  )
}
