import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  CSSProperties,
  useCallback,
  useRef,
} from 'react'

import {
  clamp,
  normalizeValue,
  radian,
  rawValue,
  stepValue,
  InputEventOption,
} from '@tremolo-ui/functions'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { addNoSelect, removeNoSelect } from '../_util'
import { AnimationCanvas, DrawFunction } from '../AnimationCanvas'

/** @category AnimationKnob */
export type AnimationKnobProps = {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // | SkewFunction
  /**
   * value set when double-clicking
   * @see enableDoubleClickDefault
   */
  defaultValue?: number

  /**
   * Value to be used as the starting point of the line when drawing.
   * @default min
   */
  startValue?: number

  /** Priority over width or height */
  size?: number | `${number}%`

  width?: number | `${number}%`
  height?: number | `${number}%`

  /** active line color */
  activeColor?: string
  /** inactive line color */
  inactiveColor?: string
  /** background color */
  bg?: string
  /** thumb color */
  thumb?: string
  lineWeight?: number
  thumbWeight?: number

  draw?: DrawFunction

  /** Whether to apply `{use-select: none}` when dragging */
  bodyNoSelect?: boolean
  /**
   * wheel control option
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   */
  keyboard?: InputEventOption | null
  enableDoubleClickDefault?: boolean
  style?: CSSProperties
  onChange?: (value: number) => void
}

/**
 * simple rotary Knob.
 * @category AnimationKnob
 */
export function AnimationKnob({
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
  activeColor = '#7998ec',
  inactiveColor = '#eee',
  bg = '#ccc',
  thumb = '#4e76e6',
  lineWeight = 6,
  thumbWeight = 4,
  draw,
  bodyNoSelect = true,
  wheel = ['raw', 1],
  keyboard = ['raw', 1],
  enableDoubleClickDefault = true,
  style,
  className,
  onChange,
  ...props
}: AnimationKnobProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof AnimationKnobProps>) {
  // -- state and ref ---
  // const [privateValue, setPrivateValue] = useState(value);
  const dragOffsetY = useRef<number | undefined>(undefined)

  // --- interpret props ---
  // const percent = normalizeValue(value, min, max, skew)

  const isRelativeSize =
    typeof (size ?? width) == 'string' || typeof height == 'string'

  const handleEvent = (
    event:
      | MouseEvent
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | TouchEvent,
  ) => {
    const isTouch = event instanceof TouchEvent
    if (isTouch && event.cancelable) event.preventDefault()
    if (dragOffsetY.current) {
      if (bodyNoSelect) addNoSelect()
      const screenY = isTouch ? event.touches[0].screenY : event.screenY
      const delta = dragOffsetY.current - screenY
      if (Math.abs(delta) < 1) return
      dragOffsetY.current = screenY
      const n = normalizeValue(value, min, max, skew)
      const v = rawValue(n + delta / 100, min, max, skew)
      const v2 = clamp(stepValue(v, step), min, max)
      if (onChange) onChange(v2)
    }
  }

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!keyboard || !onChange) return
      const key = event.key
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
        event.preventDefault()
        const x =
          key == 'ArrowRight' || key == 'ArrowUp' ? keyboard[1] : -keyboard[1]
        let v
        if (keyboard[0] == 'normalized') {
          const n = normalizeValue(value, min, max, skew)
          v = rawValue(n + x, min, max, skew)
        } else {
          v = value + x
        }
        onChange(clamp(stepValue(v, step), min, max))
      }
    },
    [value, min, max, step, skew, keyboard, onChange],
  )

  // --- hooks ---
  const wheelRefCallback = useRefCallbackEvent(
    'wheel',
    (event) => {
      if (!wheel) return
      event.preventDefault()
      const x = event.deltaY > 0 ? -wheel[1] : wheel[1]
      let v
      if (wheel[0] == 'normalized') {
        const n = normalizeValue(value, min, max, skew)
        v = rawValue(n + x, min, max, skew)
      } else {
        v = value + x
      }
      if (onChange) onChange(clamp(stepValue(v, step), min, max))
    },
    { passive: false },
    [wheel, value, min, max, skew, step, onChange],
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
    if (bodyNoSelect) removeNoSelect()
  })

  return (
    <div
      className={clsx('tremolo-animation-knob', className)}
      ref={(div) => {
        wheelRefCallback(div)
        touchMoveRefCallback(div)
      }}
      role="slider"
      tabIndex={0}
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuemin={min}
      style={{
        display: 'inline-block',
        width: size ?? width,
        height: size ?? height,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onPointerDown={(event) => {
        dragOffsetY.current = event.screenY
        handleEvent(event)
      }}
      onDoubleClick={() => {
        if (enableDoubleClickDefault && onChange) {
          onChange(defaultValue)
        }
      }}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      {...props}
    >
      <AnimationCanvas
        {...(isRelativeSize
          ? { relativeSize: true }
          : {
              width: size ?? width,
              height: size ?? height,
            })}
        draw={
          draw
            ? draw
            : (ctx, width, height) => {
                const p = normalizeValue(value, min, max, skew)
                const startP = normalizeValue(startValue, min, max, skew)
                const w = width.current,
                  cx = w / 2
                const h = height.current,
                  cy = h / 2
                const r = Math.min(cx, cy)
                if (r <= 0) return

                // reset
                ctx.clearRect(0, 0, w, h)
                ctx.lineCap = 'butt'

                // bg
                ctx.beginPath()
                ctx.fillStyle = bg
                ctx.arc(cx, cy, r - 0.5, 0, 2 * Math.PI)
                ctx.fill()

                ctx.lineWidth = lineWeight

                // inactive rotary
                ctx.beginPath()
                ctx.strokeStyle = inactiveColor
                ctx.arc(
                  cx,
                  cy,
                  r - 0.5 - lineWeight / 2,
                  radian(135),
                  radian(45),
                )
                ctx.stroke()

                // active rotary
                ctx.beginPath()
                ctx.strokeStyle = activeColor
                ctx.arc(
                  cx,
                  cy,
                  r - 0.5 - lineWeight / 2,
                  radian(135 + 270 * startP),
                  radian(135 + 270 * p),
                  p < startP,
                )
                ctx.stroke()

                // thumb
                ctx.lineCap = 'round'
                ctx.beginPath()
                ctx.moveTo(cx, cy)
                ctx.lineTo(
                  cx +
                    Math.cos(radian(135 + 270 * p)) *
                      (r - 0.5 - thumbWeight / 2),
                  cy +
                    Math.sin(radian(135 + 270 * p)) *
                      (r - 0.5 - thumbWeight / 2),
                )
                ctx.strokeStyle = thumb
                ctx.lineWidth = thumbWeight
                ctx.stroke()
              }
        }
      />
    </div>
  )
}
