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

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { addNoSelect, removeNoSelect } from '../_util'

import { XYPadArea, AreaProps } from './Area'
import { XYPadThumb, XYPadThumbMethods, ThumbProps } from './Thumb'

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

/**
 * Simple XYPad
 * @category XYPad
 */
export const XYPad = forwardRef<XYPadMethods, Props>(
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
    ref,
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
    const thumbDragged = useRef(false)

    // --- interpret props ---
    const nx = normalizeValue(x.value, x.min, x.max, x.skew)
    const ny = normalizeValue(y.value, y.min, y.max, y.skew)
    const percentX = toFixed((x.reverse ? 1 - nx : nx) * 100)
    const percentY = toFixed((y.reverse ? 1 - ny : ny) * 100)

    let areaProps: AreaProps = {},
      thumbProps: ThumbProps = {}
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
      if (
        !areaElementRef.current ||
        !thumbDragged.current ||
        !onChange ||
        readonly
      )
        return
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
      return [newX, newY]
    }

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

    useEventListener(globalThis.window, 'mousemove', (event) => {
      handleValue(event)
    })

    useEventListener(globalThis.window, 'mouseup', () => {
      if (!thumbDragged.current || readonly) return
      thumbDragged.current = false
      onDragEnd?.(x.value, y.value)
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
          thumbDragged.current = true
          const v = handleValue(event)
          if (!readonly) onDragStart?.(v?.[0] ?? x.value, v?.[1] ?? y.value)
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
  },
)

export * from './Thumb'
export * from './Area'
