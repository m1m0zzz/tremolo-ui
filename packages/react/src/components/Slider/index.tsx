import { css, CSSObject, Global } from '@emotion/react'
import {
  Direction,
  gradientDirection,
  isHorizontal,
  isReversed,
  isVertical,
  parseScaleOrderList,
  ScaleOrderList,
  ScaleType,
} from '@tremolo-ui/functions/components/Slider/type'
import { clamp, normalizeValue, rawValue, stepValue } from '@tremolo-ui/functions/math'
import { WheelOption } from '@tremolo-ui/functions/types'
import { styleHelper } from '@tremolo-ui/functions/util'
import React, { ReactElement, useRef } from 'react'
import clsx from 'clsx'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { UserActionPseudoProps } from '../../system/pseudo'

import { SliderThumb } from './Thumb'
import { SliderTrack } from './Track'
import { ScaleOption } from './type'

interface SliderProps {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // | SkewFunction
  length?: number | string
  thickness?: number | string
  direction?: Direction
  scale?: ['step', ScaleType] | [number, ScaleType] | ScaleOrderList[]
  scaleOption?: ScaleOption
  color?: string
  bg?: string
  bodyNoSelect?: boolean
  enableWheel?: WheelOption
  className?: string
  style?: CSSObject
  onChange?: (value: number) => void
  children?: ReactElement | ReactElement[]
  // ReactElement<typeof SliderThumb, typeof SliderTrack>[]
}

/**
 * Customizable slider
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  skew = 1,
  length = 140,
  thickness = 10,
  direction = 'right',
  scale,
  scaleOption,
  color = '#4e76e6',
  bg = '#eee',
  className,
  style,
  bodyNoSelect = true,
  enableWheel,
  onChange,
  children,
  ...pseudo
}: SliderProps & UserActionPseudoProps) {
  // -- state and ref ---
  const trackElementRef = useRef<HTMLDivElement>(null)

  // --- interpret props ---
  const { _active, _focus, _hover } = pseudo
  const percent = normalizeValue(value, min, max, skew) * 100
  const percentRev = isReversed(direction) ? 100 - percent : percent

  const scalesList = parseScaleOrderList(scale, min, max, step)
  if (isReversed(direction)) scalesList.reverse()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trackProps: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let thumbProps: any
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
      aria-valuemax={max}
      aria-valuemin={min}
      aria-orientation={isHorizontal(direction) ? 'horizontal' : 'vertical'}
      css={css({
        display: 'inline-block',
        boxSizing: 'border-box',
        margin: '0.7rem',
        padding: 0,
        cursor: 'pointer',
        ...style,
      })}
      onPointerDown={(event) => {
        thumbDragged.current = true
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
      <div
        css={css({
          display: 'flex',
          flexDirection: isHorizontal(direction) ? 'column' : 'row',
        })}
      >
        {/* trackProps */}
        <div
          className="tremolo-slider-track-wrapper"
          ref={trackElementRef}
          css={css({ position: 'relative' })}
        >
          <SliderTrack
            __css={{
              background: `linear-gradient(to ${gradientDirection(direction)}, ${color} ${percent}%, ${bg} ${percent}%)`,
              borderRadius: styleHelper(thickness, '/', 2),
              borderStyle: 'solid',
              borderColor: '#ccc',
              borderWidth: 2,
              width: isHorizontal(direction) ? length : thickness,
              height: isHorizontal(direction) ? thickness : length,
              zIndex: 1,
            }}
            {...trackProps}
          />
          <SliderThumb
            color={color}
            __css={{
              top: isHorizontal(direction) ? '50%' : `${percentRev}%`,
              left: isHorizontal(direction) ? `${percentRev}%` : '50%',
            }}
            {...thumbProps}
          />
        </div>
        {scale && (
          <div
            className="tremolo-slider-scale-wrapper"
            css={css({
              position: 'relative',
              width: isHorizontal(direction) ? length : undefined,
              height: isVertical(direction) ? length : undefined,
              marginLeft: isHorizontal(direction)
                ? 2
                : (scaleOption?.gap ??
                  `calc((1.4rem - ${styleHelper(thickness)}) / 2)`),
              marginTop: isVertical(direction)
                ? 2
                : (scaleOption?.gap ??
                  `calc((1.4rem - ${styleHelper(thickness)}) / 2)`),
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
                  left: isHorizontal(direction)
                    ? `${
                        isReversed(direction)
                          ? 100 - normalizeValue(item.at, min, max, skew) * 100
                          : normalizeValue(item.at, min, max, skew) * 100
                      }%`
                    : undefined,
                  top: isVertical(direction)
                    ? `${
                        isReversed(direction)
                          ? 100 - normalizeValue(item.at, min, max, skew) * 100
                          : normalizeValue(item.at, min, max, skew) * 100
                      }%`
                    : undefined,
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
}

export * from './Thumb'
export * from './Track'
export * from './type'
