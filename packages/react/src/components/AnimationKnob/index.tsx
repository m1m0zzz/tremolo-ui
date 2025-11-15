import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  useCallback,
  useImperativeHandle,
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

import { useDrag } from '../../hooks/useDrag'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { addUserSelectNone, removeUserSelectNone } from '../_util'
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
 * @category AnimationKnob
 */
export interface AnimationKnobMethods {
  focus: () => void
  blur: () => void
}

type Props = AnimationKnobProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof AnimationKnobProps>

/**
 * Animatable rotary knob.
 * @category AnimationKnob
 */
export const AnimationKnob = forwardRef<AnimationKnobMethods, Props>(
  (
    {
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
    }: Props,
    ref,
  ) => {
    // -- state and ref ---
    const valueRef = useRef(0)
    const elmRef = useRef<HTMLDivElement>(null)

    // --- interpret props ---
    const isRelativeSize =
      typeof (size ?? width) == 'string' || typeof height == 'string'

    const onDrag = useCallback(
      (_x: number, y: number) => {
        if (!onChange) return
        const v = rawValue(valueRef.current - y / 100, min, max, skew)
        const v2 = clamp(stepValue(v, step), min, max)
        onChange(v2)
      },
      [max, min, onChange, skew, step],
    )

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
    const [touchMoveRefCallback, pointerDownHandler] = useDrag<HTMLDivElement>({
      onDrag: onDrag,
      onDragStart: () => {
        valueRef.current = normalizeValue(value, min, max, skew)
        if (bodyNoSelect) addUserSelectNone()
      },
      onDragEnd: () => {
        if (bodyNoSelect) removeUserSelectNone()
      },
    })

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

    useImperativeHandle(ref, () => {
      return {
        focus() {
          elmRef.current?.focus()
        },
        blur() {
          elmRef.current?.blur()
        },
      }
    }, [])

    return (
      <div
        className={clsx('tremolo-animation-knob', className)}
        ref={(div) => {
          elmRef.current = div
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
        onPointerDown={pointerDownHandler}
        onDoubleClick={() => {
          if (enableDoubleClickDefault && onChange) {
            onChange(defaultValue)
          }
        }}
        onKeyDown={handleKeyDown}
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
              : (ctx, { width, height }) => {
                  const p = normalizeValue(value, min, max, skew)
                  const startP = normalizeValue(startValue, min, max, skew)
                  const cx = width / 2
                  const cy = height / 2
                  const r = Math.min(cx, cy)
                  if (r <= 0) return

                  // reset
                  ctx.clearRect(0, 0, width, height)
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
  },
)
