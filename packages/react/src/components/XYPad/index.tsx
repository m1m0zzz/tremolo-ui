import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactElement,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

import {
  clamp,
  normalizeValue,
  rawValue,
  stepValue,
  toFixed,
  InputEventOption,
  styleHelper,
} from '@tremolo-ui/functions'

import { useDragWithElement } from '../../hooks/useDragWithElement'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { addNoSelect, removeNoSelect } from '../_util'

import { Area, XYPadAreaProps } from './Area'
import { Thumb, XYPadThumbMethods, XYPadThumbProps } from './Thumb'

/**
 * Two-dimensional slider component.
 * @category XYPad
 */
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

/** @category XYPad */
export interface XYPadProps {
  x: ValueOptions
  y: ValueOptions

  bodyNoSelect?: boolean
  disabled?: boolean
  readonly?: boolean
  onChange?: (valueX: number, valueY: number) => void
  onDragStart?: (valueX: number, valueY: number) => void
  onDragEnd?: (valueX: number, valueY: number) => void
  /** \<XYPadThumb /> | \<XYPadArea /> */
  children?: ReactElement | ReactElement[]
}

/** @category XYPad */
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

type Props = XYPadProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadProps>

export const XYPadImpl = forwardRef<XYPadMethods, Props>(
  (
    {
      x: _x,
      y: _y,
      className,
      style,
      bodyNoSelect = true,
      disabled = false,
      readonly = false,
      onChange,
      onDragStart,
      onDragEnd,
      onPointerDown,
      onKeyDown,
      onFocus,
      onBlur,
      children,
      ...props
    }: Props,
    forwardedRef,
  ) => {
    const x = useMemo(() => {
      return { ...defaultValueOptions, ..._x }
    }, [_x])
    const y = useMemo(() => {
      return { ...defaultValueOptions, ..._y }
    }, [_y])

    // -- state and ref ---
    const areaElementRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<XYPadThumbMethods>(null)

    // --- interpret props ---
    const nx = normalizeValue(x.value, x.min, x.max, x.skew)
    const ny = normalizeValue(y.value, y.min, y.max, y.skew)
    const percentX = toFixed((x.reverse ? 1 - nx : nx) * 100)
    const percentY = toFixed((y.reverse ? 1 - ny : ny) * 100)

    let areaProps: XYPadAreaProps = {}
    let thumbProps: XYPadThumbProps = {}
    if (children != undefined) {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type == Thumb) {
            thumbProps = child.props as XYPadThumbProps
          } else if (child.type == Area) {
            areaProps = child.props as XYPadAreaProps
          } else {
            throw new Error('only <XYPadThumb> or <XYPadArea>')
          }
        } else {
          throw new Error('children is an invalid element.')
        }
      })
    }

    // --- internal functions ---
    const onDrag = useCallback(
      (nx: number, ny: number) => {
        if (!onChange || readonly) return
        const vx = rawValue(x.reverse ? 1 - nx : nx, x.min, x.max, x.skew)
        const vy = rawValue(y.reverse ? 1 - ny : ny, y.min, y.max, y.skew)
        const newX = clamp(stepValue(vx, x.step), x.min, x.max)
        const newY = clamp(stepValue(vy, y.step), y.min, y.max)
        onChange(newX, newY)
      },
      [
        onChange,
        readonly,
        x.max,
        x.min,
        x.reverse,
        x.skew,
        x.step,
        y.max,
        y.min,
        y.reverse,
        y.skew,
        y.step,
      ],
    )

    const updateValueByEvent = useCallback(
      (
        eventType: InputEventOption[0],
        target: Required<ValueOptions>,
        x: number,
      ) => {
        let v
        if (eventType == 'normalized') {
          const n = normalizeValue(
            target.value,
            target.min,
            target.max,
            target.skew,
          )
          v = rawValue(n + x, target.min, target.max, target.skew)
        } else {
          v = target.value + x
        }
        return clamp(stepValue(v, target.step), target.min, target.max)
      },
      [],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
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
          const newValue = updateValueByEvent(target.keyboard[0], target, delta)
          if (isHorizontal) {
            onChange(newValue, y.value)
          } else {
            onChange(x.value, newValue)
          }
        }
      },
      [onChange, readonly, x, y, updateValueByEvent],
    )

    // --- hooks ---
    const { refHandler: touchMoveRefCallback, pointerDownHandler } =
      useDragWithElement<HTMLDivElement>({
        baseElementRef: areaElementRef,
        onDrag: onDrag,
        onDragStart: (nx, ny) => {
          if (readonly) return
          if (bodyNoSelect) addNoSelect()
          thumbRef.current?.focus()
          const valueX = clamp(
            stepValue(rawValue(nx, x.min, x.max, x.skew), x.step),
            x.min,
            x.max,
          )
          const valueY = clamp(
            stepValue(rawValue(ny, y.min, y.max, y.skew), y.step),
            y.min,
            y.max,
          )
          onDragStart?.(valueX, valueY)
        },
        onDragEnd: (nx, ny) => {
          if (readonly) return
          if (bodyNoSelect) removeNoSelect()
          const valueX = clamp(
            stepValue(rawValue(nx, x.min, x.max, x.skew), x.step),
            x.min,
            x.max,
          )
          const valueY = clamp(
            stepValue(rawValue(ny, y.min, y.max, y.skew), y.step),
            y.min,
            y.max,
          )
          onDragEnd?.(valueX, valueY)
        },
      })

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
        const newValue = updateValueByEvent(target.wheel[0], target, delta)
        if (event.shiftKey) {
          onChange(newValue, y.value)
        } else {
          onChange(x.value, newValue)
        }
      },
      {
        passive: false,
      },
      [x, y, onChange, readonly, updateValueByEvent],
    )

    useImperativeHandle(forwardedRef, () => {
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
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
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
          margin: `calc(${styleHelper(thumbProps?.size ?? 22)} / 2)`, // half thumb size
          cursor: readonly ? 'not-allowed' : 'pointer',
          WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
        onPointerDown={(event) => {
          pointerDownHandler(event)
          onPointerDown?.(event)
        }}
        onKeyDown={(event) => {
          handleKeyDown(event)
          onKeyDown?.(event)
        }}
        onFocus={(event) => {
          thumbRef.current?.focus()
          onFocus?.(event)
        }}
        onBlur={(event) => {
          thumbRef.current?.blur()
          onBlur?.(event)
        }}
        {...props}
      >
        <div className="tremolo-xy-pad-area-wrapper" ref={areaElementRef}>
          <Area
            __thumb={
              <Thumb
                ref={thumbRef}
                __disabled={disabled}
                __readonly={readonly}
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
  },
)

/**
 * Simple XYPad
 * @category XYPad
 */
export const XYPad = Object.assign(XYPadImpl, {
  Thumb,
  Area,
})

export { type XYPadThumbProps, type XYPadThumbMethods } from './Thumb'
export { type XYPadAreaProps } from './Area'
