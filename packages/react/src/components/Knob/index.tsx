import { css, CSSObject, Global } from '@emotion/react'
import { clamp, normalizeValue, radian, rawValue, stepValue } from 'functions/math'
import { WheelOption } from 'functions/types'
import React, { useRef } from 'react'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { UserActionPseudoProps } from '../../system/pseudo'
import { AnimationCanvas } from '../AnimationCanvas'

interface KnobProps {
  // required
  value: number
  min: number
  max: number

  // optional
  defaultValue?: number
  startValue?: number
  step?: number
  skew?: number // | SkewFunction
  size?: number | `${number}%`
  width?: number | `${number}%`
  height?: number | `${number}%`
  options?: {
    active?: string
    inactive?: string
    bg?: string
    thumb?: string
    lineWeight?: number
    thumbWeight?: number
  }
  // TODO: need?
  // draw?: (
  //   context: CanvasRenderingContext2D,
  //   currentValue: number,
  //   w?: number,
  //   h?: number,
  // ) => void
  cursor?: string
  style?: CSSObject
  bodyNoSelect?: boolean
  enableWheel?: WheelOption
  enableDoubleClickDefault?: boolean
  onChange?: (value: number) => void
}

const defaultOptions = {
  active: '#7998ec',
  inactive: '#eee',
  bg: '#ccc',
  thumb: '#4e76e6',
  lineWeight: 6,
  thumbWeight: 4,
} as const

/**
 * simple rotary Knob.
 */
export function Knob({
  value,
  min,
  max,
  defaultValue = min,
  startValue = min,
  step = 1,
  skew = 1,
  size,
  width = 50,
  height = 50,
  options = defaultOptions,
  // draw,
  cursor = 'pointer',
  style,
  bodyNoSelect = true,
  enableWheel,
  enableDoubleClickDefault = true,
  onChange,
  _active,
  _focus,
  _hover,
  ...props
}: KnobProps &
  UserActionPseudoProps &
  Omit<
    React.ClassAttributes<HTMLDivElement> &
      React.HTMLAttributes<HTMLDivElement>,
    'onChange'
  >) {
  // -- state and ref ---
  // const [privateValue, setPrivateValue] = useState(value);
  const dragOffsetY = useRef<number | undefined>(undefined)

  // --- interpret props ---
  const opts = { ...defaultOptions, ...options }
  // const percent = normalizeValue(value, min, max, skew)

  const isRelativeSize = typeof (size ?? width) == 'string'
  const adaptSize = (size: number | `${number}%`) => {
    if (typeof size == 'string') {
      return Number(size.slice(0, -1))
    } else {
      return size
    }
  }

  const handleEvent = (
    event:
      | MouseEvent
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | TouchEvent,
  ) => {
    const isTouch = event instanceof TouchEvent
    if (isTouch && event.cancelable) event.preventDefault()
    if (dragOffsetY.current) {
      if (bodyNoSelect) document.body.classList.add('no-select')
      const screenY = isTouch ? event.touches[0].screenY : event.screenY
      const delta = dragOffsetY.current - screenY
      dragOffsetY.current = screenY
      const n = normalizeValue(value, min, max, skew)
      const v = rawValue(n + delta / 100, min, max, skew)
      const v2 = clamp(stepValue(v, step), min, max)
      if (onChange) onChange(v2)
    }
  }

  // --- hooks ---
  const wheelRefCallback = useRefCallbackEvent(
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
    [enableWheel, value, min, max, skew, step, onChange],
  )

  const touchMoveRefCallback = useRefCallbackEvent(
    'touchmove',
    handleEvent,
    { passive: false },
    [value, min, max, skew, step, onChange, bodyNoSelect],
  )

  useEventListener(window, 'mousemove', handleEvent)

  useEventListener(window, 'pointerup', () => {
    dragOffsetY.current = undefined
    if (bodyNoSelect) document.body.classList.remove('no-select')
  })

  return (
    <div
      className="tremolo-knob"
      ref={(div) => {
        wheelRefCallback(div)
        touchMoveRefCallback(div)
      }}
      role="slider"
      tabIndex={0}
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuemin={min}
      css={css({
        display: 'inline-block',
        width: size ?? width,
        height: size ?? height,
        cursor: cursor,
        ...style,
        ':active': {
          ..._active,
        },
        ':focus': {
          ..._focus,
        },
        ':hover': {
          ..._hover,
        },
      })}
      onPointerDown={(event) => {
        dragOffsetY.current = event.screenY
        handleEvent(event)
      }}
      onDoubleClick={() => {
        if (enableDoubleClickDefault && onChange) {
          onChange(defaultValue)
        }
      }}
      {...props}
    >
      <Global
        styles={{
          '.no-select': {
            userSelect: 'none',
          },
        }}
      />
      <AnimationCanvas
        width={adaptSize(size ?? width)}
        height={adaptSize(size ?? height)}
        relativeSize={isRelativeSize}
        // TODO
        // reduceFlickering={false}
        draw={(ctx, _w, _h) => {
          const p = normalizeValue(value, min, max, skew)
          const startP = normalizeValue(startValue, min, max, skew)
          const w = _w.current,
            cx = w / 2
          const h = _h.current,
            cy = h / 2
          const r = Math.min(cx, cy)
          if (r <= 0) return

          // reset
          ctx.clearRect(0, 0, w, h)
          ctx.lineCap = 'butt'

          // bg
          ctx.beginPath()
          ctx.fillStyle = opts.bg
          ctx.arc(cx, cy, r - 0.5, 0, 2 * Math.PI)
          ctx.fill()

          ctx.lineCap = 'round'
          ctx.lineWidth = opts.lineWeight

          // inactive rotary
          ctx.beginPath()
          ctx.strokeStyle = opts.inactive
          ctx.arc(
            cx,
            cy,
            r - 0.5 - opts.lineWeight / 2,
            radian(135),
            radian(45),
          )
          ctx.stroke()

          // active rotary
          ctx.beginPath()
          ctx.strokeStyle = opts.active
          ctx.arc(
            cx,
            cy,
            r - 0.5 - opts.lineWeight / 2,
            radian(135 + 270 * startP),
            radian(135 + 270 * p),
            p < startP,
          )
          ctx.stroke()

          // thumb
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(
            cx +
              Math.cos(radian(135 + 270 * p)) *
                (r - 0.5 - opts.thumbWeight / 2),
            cy +
              Math.sin(radian(135 + 270 * p)) *
                (r - 0.5 - opts.thumbWeight / 2),
          )
          ctx.strokeStyle = opts.thumb
          ctx.lineWidth = opts.thumbWeight
          ctx.stroke()
        }}
      />
    </div>
  )
}
