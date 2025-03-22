import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  CSSProperties,
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
  xor,
} from '@tremolo-ui/functions'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { addNoSelect, removeNoSelect } from '../_util'

import { SliderProvider } from './context'
import { Scale } from './Scale'
import { SliderThumb, SliderThumbMethods, SliderThumbProps } from './Thumb'
import { SliderTrack, SliderTrackProps } from './Track'

/** @category Slider */
export interface SliderProps {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // TODO | SkewFunction
  vertical?: boolean
  reverse?: boolean
  bodyNoSelect?: boolean
  /**
   * wheel control option
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   */
  keyboard?: InputEventOption | null
  /**
   * Only the appearance will change.
   * Please consider using with readonly.
   */
  disabled?: boolean
  /**
   * Make the value unchangeable.
   */
  readonly?: boolean
  className?: string
  style?: CSSProperties
  onChange?: (value: number) => void
  /** \<SliderThumb /> | \<SliderTrack /> */
  children?: ReactElement | ReactElement[]
  // ReactElement<typeof SliderThumb, typeof SliderTrack>[]
}

/**
 * Customizable slider component.
 * @category Slider
 */
export interface SliderMethods {
  focus: () => void
  blur: () => void
}

type Props = SliderProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderProps>

/**
 * Customizable slider
 * @category Slider
 */
export const Slider = forwardRef<SliderMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      skew = 1,
      vertical = false,
      reverse = false,
      className,
      style,
      bodyNoSelect = true,
      wheel = ['raw', 1],
      keyboard = ['raw', 1],
      disabled = false,
      readonly = false,
      onChange,
      children,
      ...props
    }: Props,
    ref,
  ) => {
    // -- state and ref ---
    const trackElementRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<SliderThumbMethods>(null)
    const thumbDragged = useRef(false)

    // --- interpret props ---
    const p = toFixed(normalizeValue(value, min, max, skew) * 100)
    const rev = toFixed(100 - p)
    // NOTE
    // normal -> normal (right)
    // vertical -> rev (up)
    // reverse -> rev (left)
    // vertical & reverse -> normal (down)
    const displayReversed = useMemo(
      () => xor(vertical, reverse),
      [vertical, reverse],
    )
    const percent = displayReversed ? rev : p

    let trackProps: SliderTrackProps = {}
    let thumbProps: SliderThumbProps = {}
    let scaleComponent: ReactElement | undefined = undefined
    if (children != undefined) {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type == SliderThumb) {
            thumbProps = child.props as SliderThumbProps
          } else if (child.type == SliderTrack) {
            trackProps = child.props as SliderTrackProps
          } else if (child.type == Scale) {
            scaleComponent = child
          } else {
            throw new Error('only <SliderThumb> or <SliderTrack>')
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
        !trackElementRef.current ||
        !thumbDragged.current ||
        !onChange ||
        readonly
      ) {
        return
      }
      const isTouch = event instanceof TouchEvent
      if (isTouch && event.cancelable) event.preventDefault()
      if (bodyNoSelect) addNoSelect()
      const {
        left: x1,
        top: y1,
        right: x2,
        bottom: y2,
      } = trackElementRef.current.getBoundingClientRect()
      const mouseX = isTouch ? event.touches[0].clientX : event.clientX
      const mouseY = isTouch ? event.touches[0].clientY : event.clientY
      const n = vertical
        ? normalizeValue(mouseY, y1, y2)
        : normalizeValue(mouseX, x1, x2)
      const v = rawValue(displayReversed ? 1 - n : n, min, max, skew)
      onChange(clamp(stepValue(v, step), min, max))
    }

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!keyboard || !onChange || readonly) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          event.preventDefault()
          let x =
            key == 'ArrowRight' || key == 'ArrowUp' ? keyboard[1] : -keyboard[1]
          if (reverse) x *= -1
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
      [value, min, max, step, skew, reverse, keyboard, onChange, readonly],
    )

    // --- hooks ---
    const touchMoveRefCallback = useRefCallbackEvent(
      'touchmove',
      handleValue,
      { passive: false },
      [min, max, skew, step, vertical, reverse, onChange, readonly],
    )

    const wheelRefCallback = useRefCallbackEvent(
      'wheel',
      (event) => {
        if (!wheel || !onChange || readonly) return
        event.preventDefault()
        let x
        if (!vertical && event.deltaX != 0) {
          x = event.deltaX > 0 ? wheel[1] : -wheel[1]
        } else {
          if (event.deltaY == 0) return
          x = event.deltaY > 0 ? -wheel[1] : wheel[1]
        }
        if (vertical && reverse) x *= -1
        let v
        if (wheel[0] == 'normalized') {
          const n = normalizeValue(value, min, max, skew)
          v = rawValue(n + x, min, max, skew)
        } else {
          v = value + x
        }
        onChange(clamp(stepValue(v, step), min, max))
      },
      {
        passive: false,
      },
      [wheel, value, min, max, skew, step],
    )

    useEventListener(globalThis.window, 'mousemove', (event) => {
      handleValue(event)
    })

    useEventListener(globalThis.window, 'mouseup', () => {
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
      <SliderProvider
        min={min}
        max={max}
        step={step}
        skew={skew}
        vertical={vertical}
        reverse={reverse}
        disabled={disabled}
        readonly={readonly}
      >
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
          aria-orientation={vertical ? 'vertical' : 'horizontal'}
          aria-disabled={disabled}
          aria-readonly={readonly}
          style={{
            margin: `calc(${styleHelper(thumbProps?.size ?? 22)} / 2)`, // half thumb size
            ...style,
          }}
          onPointerDown={(event) => {
            thumbDragged.current = true
            handleValue(event)
          }}
          onKeyDown={handleKeyDown}
          onFocus={thumbRef.current?.focus}
          onBlur={thumbRef.current?.blur}
          {...props}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: vertical ? 'row' : 'column',
              width: !vertical ? '100%' : undefined,
              height: vertical ? '100%' : undefined,
            }}
          >
            <div className="tremolo-slider-track-wrapper" ref={trackElementRef}>
              <SliderTrack
                __percent={percent}
                __thumb={
                  <SliderThumb
                    ref={thumbRef}
                    __percent={percent}
                    {...thumbProps}
                  />
                }
                {...trackProps}
              />
            </div>
            {scaleComponent}
          </div>
        </div>
      </SliderProvider>
    )
  },
)

export { useSliderContext } from './context'
export {
  SliderThumb,
  type SliderThumbMethods,
  type SliderThumbProps,
} from './Thumb'
export { SliderTrack, type SliderTrackProps } from './Track'
export { Scale, type ScaleProps } from './Scale'
export { ScaleOption, type ScaleOptionProps } from './ScaleOption'
