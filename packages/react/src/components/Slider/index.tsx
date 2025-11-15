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

import { useDragWithElement } from '../../hooks/useDragWithElement'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import {
  addUserSelectNone,
  Cursor,
  removeUserSelectNone,
  resetCursorStyle,
  setCursorStyle,
} from '../_util'

import { SliderProvider } from './context'
import { Scale } from './Scale'
import { ScaleOption } from './ScaleOption'
import { Thumb, SliderThumbMethods, SliderThumbProps } from './Thumb'
import { Track, SliderTrackProps } from './Track'

const defaultExternalStyles: SliderProps['externalStyles'] = {
  userSelectNone: true,
  cursor: 'pointer',
}

/** @category Slider */
export interface SliderProps {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // TODO | SkewFunction
  /**
   * slider orientation
   * aria-orientation property is also applied.
   */
  vertical?: boolean
  reverse?: boolean

  /** Global style to apply when dragged */
  externalStyles?: {
    userSelectNone?: boolean
    cursor?: Cursor
  }
  /**
   * wheel control option
   * If null, no event will be triggered
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   * If null, no event will be triggered
   */
  keyboard?: InputEventOption | null

  /**
   * Only the appearance will change.
   * Please consider using with readonly.
   * aria-disabled property is also applied.
   */
  disabled?: boolean
  /**
   * Make the value unchangeable.
   * aria-readonly property is also applied.
   */
  readonly?: boolean
  className?: string
  style?: CSSProperties
  onChange?: (value: number) => void
  onDragStart?: (value: number) => void
  onDragEnd?: (value: number) => void
  /** \<SliderThumb /> | \<SliderTrack /> */
  children?: ReactElement | ReactElement[]
  // ReactElement<typeof SliderThumb, typeof SliderTrack>[]
}

/**
 * @category Slider
 */
export interface SliderMethods {
  focus: () => void
  blur: () => void
}

type Props = SliderProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderProps>

const SliderImpl = forwardRef<SliderMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      skew = 1,
      vertical = false,
      reverse = false,
      externalStyles: _externalStyles,
      wheel = ['raw', 1],
      keyboard = ['raw', 1],
      disabled = false,
      readonly = false,
      onChange,
      onDragStart,
      onDragEnd,
      className,
      style,
      children,
      onFocus,
      onBlur,
      onPointerDown,
      onKeyDown,
      ...props
    }: Props,
    forwardedRef,
  ) => {
    // -- state and ref ---
    const trackElementRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<SliderThumbMethods>(null)

    // --- interpret props ---
    const externalStyles = { ...defaultExternalStyles, ..._externalStyles }

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
          if (child.type == Thumb) {
            thumbProps = child.props as SliderThumbProps
          } else if (child.type == Track) {
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
    const onDrag = useCallback(
      (nx: number, ny: number) => {
        if (!onChange || readonly) return
        const n = vertical ? ny : nx
        const v = rawValue(displayReversed ? 1 - n : n, min, max, skew)
        const v2 = clamp(stepValue(v, step), min, max)
        onChange(v2)
      },
      [displayReversed, max, min, onChange, readonly, skew, step, vertical],
    )

    const updateValueByEvent = useCallback(
      (eventType: InputEventOption[0], x: number) => {
        let newValue
        if (eventType == 'normalized') {
          const n = normalizeValue(value, min, max, skew)
          newValue = rawValue(n + x, min, max, skew)
        } else {
          newValue = value + x
        }
        return clamp(stepValue(newValue, step), min, max)
      },
      [max, min, skew, step, value],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!keyboard || !onChange || readonly) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          event.preventDefault()
          let x =
            key == 'ArrowRight' || key == 'ArrowUp' ? keyboard[1] : -keyboard[1]
          if (reverse) x *= -1
          onChange(updateValueByEvent(keyboard[0], x))
        }
      },
      [keyboard, onChange, readonly, reverse, updateValueByEvent],
    )

    // --- hooks ---
    const { refHandler: touchMoveRefCallback, pointerDownHandler } =
      useDragWithElement<HTMLDivElement>({
        baseElementRef: trackElementRef,
        onDrag: onDrag,
        onDragStart: (nx, ny) => {
          if (readonly) return
          if (externalStyles.userSelectNone) addUserSelectNone()
          if (externalStyles.cursor) setCursorStyle(externalStyles.cursor)

          thumbRef.current?.focus()
          onDragStart?.(
            clamp(
              stepValue(rawValue(vertical ? ny : nx, min, max, skew), step),
              min,
              max,
            ),
          )
        },
        onDragEnd: (nx, ny) => {
          if (readonly) return

          if (externalStyles.userSelectNone) removeUserSelectNone()
          if (externalStyles.cursor) resetCursorStyle()

          onDragEnd?.(
            clamp(
              stepValue(rawValue(vertical ? ny : nx, min, max, skew), step),
              min,
              max,
            ),
          )
        },
      })

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
        onChange(updateValueByEvent(wheel[0], x))
      },
      {
        passive: false,
      },
      [wheel, vertical, readonly, onChange, updateValueByEvent],
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
          <div
            style={{
              display: 'flex',
              flexDirection: vertical ? 'row' : 'column',
              width: !vertical ? '100%' : undefined,
              height: vertical ? '100%' : undefined,
            }}
          >
            <div className="tremolo-slider-track-wrapper" ref={trackElementRef}>
              <Track
                __percent={percent}
                __thumb={
                  <Thumb ref={thumbRef} __percent={percent} {...thumbProps} />
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

/**
 * Customizable slider
 * @category Slider
 */
export const Slider = Object.assign(SliderImpl, {
  Thumb,
  Track,
  Scale,
  ScaleOption,
})

export { useSliderContext } from './context'
export { type SliderThumbMethods, type SliderThumbProps } from './Thumb'
export { type SliderTrackProps } from './Track'
export { type ScaleProps } from './Scale'
export { type ScaleOptionProps } from './ScaleOption'
export { type ScaleOptions, type ScaleType } from './type'
