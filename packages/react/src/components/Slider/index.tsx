import { css, Global } from '@emotion/react'
import {
  Direction,
  gradientDirection,
  isHorizontal,
  isReversed,
  isVertical,
  parseScaleOrderList,
  ScaleOption,
  ScaleOrderList,
  ScaleType,
} from 'common/components/Slider/type'
import { clamp, normalizeValue, rawValue, stepValue } from 'common/math'
import { WheelOption } from 'common/types'
import { styleHelper } from 'common/util'
import React, { Children, isValidElement, ReactNode, useRef } from 'react'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'

// interface SliderThumbProps {}

export function SliderThumb(/* {}: SliderThumbProps */) {
  return <div></div>
}

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
  style?: React.CSSProperties
  onChange?: (value: number) => void
  children?: ReactNode // SliderThumb
}

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
}: SliderProps) {
  // -- state and ref ---
  const trackElementRef = useRef<HTMLDivElement>(null)

  // --- interpret props ---
  const percent = normalizeValue(value, min, max, skew) * 100
  const percentRev = isReversed(direction) ? 100 - percent : percent

  const scalesList = parseScaleOrderList(scale, min, max, step)
  if (isReversed(direction)) scalesList.reverse()

  // let defaultThumb = true
  if (children != undefined) {
    const childElements = Children.toArray(children)
    const lastElement = childElements[childElements.length - 1]
    if (isValidElement(lastElement)) {
      // defaultThumb = false
      if (lastElement.type == SliderThumb) {
        // do something
      } else {
        // throw new Error("children must be <SliderThumb />")
      }
    } else {
      throw new Error('children is an invalid element.')
    }
  }

  const thumbDragged = useRef(false)
  const handleValue = (
    event: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (trackElementRef.current && thumbDragged.current) {
      if (bodyNoSelect) document.body.classList.add('no-select')
      const {
        left: x1,
        top: y1,
        right: x2,
        bottom: y2,
      } = trackElementRef.current.getBoundingClientRect()
      const mouseX = event.clientX
      const mouseY = event.clientY
      const n = isHorizontal(direction)
        ? normalizeValue(mouseX, x1, x2)
        : normalizeValue(mouseY, y1, y2)
      const v = rawValue(isReversed(direction) ? 1 - n : n, min, max, skew)
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
    [value],
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
      ref={wrapperRef}
      className={'tremolo-slider' + className ? ` ${className}` : ''}
      css={css({
        display: 'inline-block',
        boxSizing: 'border-box',
        margin: '0.7rem',
        padding: 0,
        cursor: 'pointer',
      })}
      onMouseDown={(event) => {
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
        <div
          className="tremolo-slider-track"
          ref={trackElementRef}
          css={css({
            background: `linear-gradient(to ${gradientDirection(direction)}, ${color} ${percent}%, ${bg} ${percent}%)`,
            borderRadius:
              typeof thickness == 'number'
                ? thickness / 2
                : `calc(${thickness} / 2)`,
            borderStyle: 'solid',
            borderColor: '#ccc',
            borderWidth: 2,
            width: isHorizontal(direction) ? length : thickness,
            height: isHorizontal(direction) ? thickness : length,
            position: 'relative',
            zIndex: 1,
            ...style,
          })}
        >
          <div
            className="tremolo-slider-thumb-wrapper"
            css={css({
              width: 'fit-content',
              height: 'fit-content',
              position: 'absolute',
              top: isHorizontal(direction) ? '50%' : `${percentRev}%`,
              left: isHorizontal(direction) ? `${percentRev}%` : '50%',
              translate: '-50% -50%',
              zIndex: 100,
            })}
          >
            {children ? (
              children
            ) : (
              <div
                className="tremolo-slider-thumb"
                css={css({
                  background: color,
                  width: '1.4rem',
                  height: '1.4rem',
                  borderRadius: '50%',
                })}
              ></div>
            )}
          </div>
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
                {item.type != 'number' && (
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
                {item.type != 'mark' && (
                  <div
                    className="tremolo-slider-scale-number"
                    css={css({
                      color: item.style?.labelColor ?? scaleOption?.labelColor,
                    })}
                  >
                    {item.at}
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

export * from 'common/components/Slider/type'
