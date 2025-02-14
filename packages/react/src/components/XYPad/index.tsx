import clsx from 'clsx'
import { clamp, normalizeValue, rawValue, stepValue, toFixed, InputEventOption, styleHelper } from '@tremolo-ui/functions'
import React, { CSSProperties, forwardRef, ReactElement, useCallback, useImperativeHandle, useMemo, useRef } from 'react'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { addNoSelect, removeNoSelect } from '../_util'

import { XYPadThumb, XYPadThumbMethods, ThumbProps } from './Thumb'
import { XYPadArea, AreaProps } from './Area'

export interface ValueOptions {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number
  reverse?: boolean
  /**
   * wheel control option
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   */
  keyboard?: InputEventOption | null
}

export interface XYPadProps {
  x: ValueOptions
  y: ValueOptions

  bodyNoSelect?: boolean
  disabled?: boolean
  readonly?: boolean
  className?: string
  style?: CSSProperties
  onChange?: (valueX: number, valueY: number) => void
  /** \<XYPadThumb /> | \<XYPadArea /> */
  children?: ReactElement | ReactElement[]
}

export interface XYPadMethods {
  focus: () => void
  blur: () => void
}

const defaultValueOptions = {
  skew: 1,
  step: 1,
  reverse: false,
  wheel: ['raw', 1] as InputEventOption,
  keyboard: ['raw', 1] as InputEventOption,
}

/**
 * Simple XYPad
 */
 export const XYPad = forwardRef<XYPadMethods, XYPadProps>(({
  x: _x,
  y: _y,
  className,
  style,
  bodyNoSelect = true,
  disabled = false,
  readonly = false,
  onChange,
  children,
}: XYPadProps, ref) => {
  const x = { ...defaultValueOptions, ..._x }
  const y = { ...defaultValueOptions, ..._y }

  // -- state and ref ---
  const areaElementRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<XYPadThumbMethods>(null)
  const thumbDragged = useRef(false)

  // --- interpret props ---
  const nx = normalizeValue(x.value, x.min, x.max, x.skew)
  const ny = normalizeValue(y.value, y.min, y.max, y.skew)
  const percentX = toFixed((x.reverse ? 1 - nx : nx) * 100)
  const percentY = toFixed((y.reverse ? 1 - ny : ny) * 100)

  let areaProps: AreaProps = {}, thumbProps: ThumbProps = {}
  if (children != undefined) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type == XYPadThumb) {
          thumbProps = child.props as ThumbProps
        } else if (child.type == XYPadArea) {
          areaProps = child.props as AreaProps
        } else {
          throw new Error('only <XYPadThumb> or <XYPadArea>')
        }
      } else {
        throw new Error('children is an invalid element.')
      }
    })
  }

  // --- internal functions ---
  const handleValue = (
    event: MouseEvent | React.PointerEvent<HTMLDivElement> | TouchEvent,
  ) => {
    if (!areaElementRef.current || !thumbDragged.current || !onChange || readonly) return
    const isTouch = event instanceof TouchEvent
    if (isTouch && event.cancelable) event.preventDefault()
    if (bodyNoSelect) addNoSelect()
    const {
      left: x1,
      top: y1,
      right: x2,
      bottom: y2,
    } = areaElementRef.current.getBoundingClientRect()
    const mouseX = isTouch ? event.touches[0].clientX : event.clientX
    const mouseY = isTouch ? event.touches[0].clientY : event.clientY
    const nx = normalizeValue(mouseX, x1, x2)
    const ny = normalizeValue(mouseY, y1, y2)
    const vx = rawValue(x.reverse ? 1 - nx : nx, x.min, x.max, x.skew)
    const vy = rawValue(y.reverse ? 1 - ny : ny, y.min, y.max, y.skew)
    const newX = clamp(stepValue(vx, x.step), x.min, x.max)
    const newY = clamp(stepValue(vy, y.step), y.min, y.max)
    onChange(newX, newY)
  }

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onChange || readonly) return
    const key = event.key
    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
      const isHorizontal = key == 'ArrowRight' || key == 'ArrowLeft'
      const target = isHorizontal ? x : y
      if (!target.keyboard) return
      event.preventDefault()
      let delta = target.keyboard[1]
      if (key == 'ArrowLeft' || key == 'ArrowUp') delta *= -1
      if (target.reverse) delta *= -1
      let v
      if (target.keyboard[0] == 'normalized') {
        const n = normalizeValue(target.value, target.min, target.max, target.skew)
        v = rawValue(n + delta, target.min, target.max, target.skew)
      } else {
        v = target.value + delta
      }
      const newValue = clamp(stepValue(v, target.step), target.min, target.max)
      if (isHorizontal) {
        onChange(newValue, y.value)
      } else {
        onChange(x.value, newValue)
      }
    }
  }, [x, y, onChange, readonly])

  // --- hooks ---
  const touchMoveRefCallback = useRefCallbackEvent(
    'touchmove',
    handleValue,
    { passive: false },
    [x, onChange, readonly],
  )

  const wheelRefCallback = useRefCallbackEvent(
    'wheel',
    (event) => {
      if (!onChange || readonly) return
      const target = event.shiftKey ? x : y
      if (!target.wheel) return
      event.preventDefault()
      let delta = target.wheel[1]
      if (event.deltaY < 0) delta *= -1
      if (target.reverse) delta *= -1
      let v
      if (target.wheel[0] == 'normalized') {
        const n = normalizeValue(target.value, target.min, target.max, target.skew)
        v = rawValue(n + delta, target.min, target.max, target.skew)
      } else {
        v = target.value + delta
      }
      const newValue = clamp(stepValue(v, target.step), target.min, target.max)
      if (event.shiftKey) {
        onChange(newValue, y.value)
      } else {
        onChange(x.value, newValue)
      }
    },
    {
      passive: false,
    },
    [x, y],
  )

  useEventListener(window, 'mousemove', (event) => {
    handleValue(event)
  })

  useEventListener(window, 'mouseup', () => {
    thumbDragged.current = false
    if (bodyNoSelect) removeNoSelect()
  })

  useImperativeHandle(ref, () => {
    return {
      focus() {
        thumbRef.current?.focus()
      },
      blur() {
        thumbRef.current?.blur()
      },
    }
  }, [])

  return (
    <div
      className={clsx('tremolo-xy-pad', className)}
      ref={(div) => {
        wheelRefCallback(div)
        touchMoveRefCallback(div)
      }}
      tabIndex={-1}
      aria-disabled={disabled}
      aria-readonly={readonly}
      style={{
        display: 'inline-block',
        margin: `calc(${styleHelper(thumbProps?.size ?? 22)} / 2)`, // half thumb size
        cursor: readonly ? 'not-allowed' : 'pointer',
        outline: 0,
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onPointerDown={(event) => {
        thumbDragged.current = true
        handleValue(event)
      }}
      onKeyDown={handleKeyDown}
      onFocus={thumbRef.current?.focus}
      onBlur={thumbRef.current?.blur}
    >
      <div
        className="tremolo-xy-pad-area-wrapper"
        ref={areaElementRef}
      >
        <XYPadArea
          __thumb={
            <XYPadThumb
              ref={thumbRef}
              __disabled={disabled}
              __css={{
                top: `${percentY}%`,
                left: `${percentX}%`,
              }}
              {...thumbProps}
            />
          }
          {...areaProps}
        />
      </div>
    </div>
  )
})

export * from './Thumb'
export * from './Area'
