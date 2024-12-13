import { css, CSSObject, Global } from '@emotion/react'
import {
  Direction,
  isHorizontal,
  isReversed,
  isVertical,
  parseScaleOrderList,
  ScaleOrderList,
  ScaleType,
} from '@tremolo-ui/functions/Slider'
import { clamp, normalizeValue, rawValue, stepValue, toFixed } from '@tremolo-ui/functions'
import { WheelOption } from '@tremolo-ui/functions'
import { styleHelper } from '@tremolo-ui/functions'
import React, { forwardRef, ReactElement, useImperativeHandle, useRef } from 'react'
import clsx from 'clsx'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { UserActionPseudoProps } from '../../system/pseudo'

import { SliderThumb, SliderThumbMethods } from './Thumb'
import { SliderTrack } from './Track'
import { ScaleOption } from './type'

interface SliderProps {
  // TODO: property docs
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // TODO | SkewFunction
  direction?: Direction // TODO: vertical & reverse
  // TODO: scales component
  scale?: ['step', ScaleType] | [number, ScaleType] | ScaleOrderList[]
  scaleOption?: ScaleOption
  bodyNoSelect?: boolean
  enableWheel?: WheelOption
  enableKey?: boolean
  className?: string
  style?: CSSObject
  onChange?: (value: number) => void
  children?: ReactElement | ReactElement[]
  // ReactElement<typeof SliderThumb, typeof SliderTrack>[]
}

export interface SliderMethods {
  focus: () => void
  blur: () => void
}

/**
 * Customizable slider
 */
 export const Slider = forwardRef<SliderMethods, SliderProps>(({
  value,
  min,
  max,
  step = 1,
  skew = 1,
  direction = 'right',
  scale,
  scaleOption,
  className,
  style,
  bodyNoSelect = true,
  enableWheel,
  enableKey = true,
  onChange,
  children,
  ...pseudo
}: SliderProps & UserActionPseudoProps, ref) => {
  // -- state and ref ---
  const trackElementRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<SliderThumbMethods>(null)

  // --- interpret props ---
  const { _active, _focus, _hover } = pseudo
  const percent = toFixed(normalizeValue(value, min, max, skew) * 100)
  const percentRev = isReversed(direction) ? toFixed(100 - percent) : percent
  const calcPercent = (v: number) => {
    return toFixed(
      isReversed(direction)
        ? 100 - normalizeValue(v, min, max, skew) * 100
        : normalizeValue(v, min, max, skew) * 100
    )
  }

  const scalesList = parseScaleOrderList(scale, min, max, step)
  if (isReversed(direction)) scalesList.reverse()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trackProps: any, thumbProps: any
  if (children != undefined) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type == SliderThumb) {
          thumbProps = child.props
        } else if (child.type == SliderTrack) {
          trackProps = child.props
        } else {
          throw new Error('only <SliderThumb> or <SliderTrack>')
        }
      } else {
        throw new Error('children is an invalid element.')
      }
    })
  }

  const thumbDragged = useRef(false)
  const handleValue = (
    event: MouseEvent | React.PointerEvent<HTMLDivElement> | TouchEvent,
  ) => {
    if (!trackElementRef.current || !thumbDragged.current) return
    const isTouch = event instanceof TouchEvent
    if (isTouch && event.cancelable) event.preventDefault()
    if (bodyNoSelect) document.body.classList.add('no-select')
    const {
      left: x1,
      top: y1,
      right: x2,
      bottom: y2,
    } = trackElementRef.current.getBoundingClientRect()
    const mouseX = isTouch ? event.touches[0].clientX : event.clientX
    const mouseY = isTouch ? event.touches[0].clientY : event.clientY
    const n = isHorizontal(direction)
      ? normalizeValue(mouseX, x1, x2)
      : normalizeValue(mouseY, y1, y2)
    const v = rawValue(isReversed(direction) ? 1 - n : n, min, max, skew)
    const v2 = clamp(stepValue(v, step), min, max)
    if (onChange) onChange(v2)
  }

  // --- hooks ---
  const touchMoveRefCallback = useRefCallbackEvent(
    'touchmove',
    handleValue,
    { passive: false },
    [min, max, skew, step, direction, onChange],
  )

  const wheelRefCallback = useRefCallbackEvent(
    'wheel',
    (event) => {
      if (!enableWheel) return
      event.preventDefault()
      let x = event.deltaY > 0 ? enableWheel[1] : -enableWheel[1]
      if (isReversed(direction) || isHorizontal(direction)) x *= -1
      let v
      if (enableWheel[0] == 'normalized') {
        const n = normalizeValue(value, min, max, skew)
        v = rawValue(n + x, min, max, skew)
      } else {
        v = value + x
      }
      if (onChange) onChange(clamp(stepValue(v, step), min, max))
    },
    {
      passive: false,
    },
    [enableWheel, value, min, max, skew, step],
  )

  useEventListener(window, 'mousemove', (event) => {
    handleValue(event)
  })

  useEventListener(window, 'mouseup', () => {
    thumbDragged.current = false
    if (bodyNoSelect) document.body.classList.remove('no-select')
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
      className={clsx('tremolo-slider', className)}
      ref={(div) => {
        wheelRefCallback(div)
        touchMoveRefCallback(div)
      }}
      tabIndex={-1}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-orientation={isHorizontal(direction) ? 'horizontal' : 'vertical'}
      css={css({
        display: 'inline-block',
        margin: `calc(${styleHelper(thumbProps?.size ?? 22)} / 2)`, // half thumb size
        cursor: 'pointer',
        outline: 0,
        ...style,
      })}
      onPointerDown={(event) => {
        thumbDragged.current = true
        handleValue(event)
      }}
      onKeyDown={(event) => {
        // TODO: key option
        if (!enableKey || !onChange) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          event.preventDefault()
          const sign = (key == 'ArrowRight' || key == 'ArrowUp') ? 1 : -1
          onChange(clamp(stepValue(value + sign, step), min, max))
        }
      }}
      onFocus={thumbRef.current?.focus}
      onBlur={thumbRef.current?.blur}
    >
      <Global
        styles={{
          '.no-select': {
            userSelect: 'none',
          },
        }}
      />
      <div
        css={css({
          display: 'flex',
          flexDirection: isHorizontal(direction) ? 'column' : 'row',
        })}
      >
        <div
          className="tremolo-slider-track-wrapper"
          ref={trackElementRef}
          css={css({ position: 'relative' })}
        >
          <SliderTrack
            __direction={direction}
            __percent={percent}
            {...trackProps}
          />
          <SliderThumb
            ref={thumbRef}
            __css={{
              top: isHorizontal(direction) ? '50%' : `${percentRev}%`,
              left: isHorizontal(direction) ? `${percentRev}%` : '50%',
            }}
            {...thumbProps}
          />
        </div>
        {/* TODO: scales component */}
        {scale && (
          <div
            className="tremolo-slider-scale-wrapper"
            css={css({
              display: 'block',
              position: 'relative',
              marginLeft: isVertical(direction)
                ? (scaleOption?.gap ??
                  `calc((22px - ${styleHelper(trackProps?.thickness ?? 10)}) / 2)`)
                : undefined,
              marginTop: isHorizontal(direction)
                ? (scaleOption?.gap ??
                  `calc((22px - ${styleHelper(trackProps?.thickness ?? 10)}) / 2)`)
                : undefined,
              ...scaleOption?.style,
              // zIndex: 10,
            })}
          >
            {scalesList.map((item, index) => (
              <div
                key={index}
                css={css({
                  display: 'flex',
                  flexDirection: isHorizontal(direction) ? 'column' : 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  left: isHorizontal(direction) ? `${calcPercent(item.at)}%` : undefined,
                  top: isVertical(direction) ? `${calcPercent(item.at)}%` : undefined,
                  translate: isHorizontal(direction) ? '-50% 0' : '0 -50%',
                  zIndex: 10,
                })}
              >
                {(item.type ?? scaleOption?.defaultType ?? 'mark-number') !=
                  'number' && (
                  <div
                    className="tremolo-slider-scale-mark"
                    css={css({
                      width: isHorizontal(direction)
                        ? (item.style?.thickness ?? 1)
                        : (item.style?.length ?? '0.5rem'),
                      height: isVertical(direction)
                        ? (item.style?.thickness ?? 1)
                        : (item.style?.length ?? '0.5rem'),
                      backgroundColor:
                        item.style?.markColor ??
                        scaleOption?.markColor ??
                        '#222',
                      marginBottom: isHorizontal(direction) ? 2 : undefined,
                      marginRight: isVertical(direction) ? 2 : undefined,
                    })}
                  ></div>
                )}
                {(item.type ?? scaleOption?.defaultType ?? 'mark-number') !=
                  'mark' && (
                  <div
                    className="tremolo-slider-scale-number"
                    css={css({
                      color: item.style?.labelColor ?? scaleOption?.labelColor,
                      width: scaleOption?.labelWidth,
                      textAlign: 'right',
                    })}
                  >
                    {item.text ?? item.at}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export * from './Thumb'
export * from './Track'
export * from './type'
