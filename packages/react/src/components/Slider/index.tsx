import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

import type { AxisOptions, XY } from '@tremolo-ui/dom'
import {
  clamp,
  normalizeValue,
  rawValue,
  stepValue,
  toFixed,
  InputEventOption,
  xor,
} from '@tremolo-ui/functions'

import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { addUserSelectNone, Cursor, removeUserSelectNone } from '../_util'
import { useComposedRefs } from '../_util/composeRefs'

import { SliderProvider } from './context'
import { Scale } from './Scale'
import { ScaleOption } from './ScaleOption'
import { Thumb, SliderThumbMethods } from './Thumb'
import { Track } from './Track'

const defaultExternalStyles: SliderProps['externalStyles'] = {
  userSelectNone: true,
  cursor: 'pointer',
}

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
  /**
   * The slider renders exactly what you compose here; there is no default
   * markup to fall back to.
   *
   * @example
   * <Slider.Root value={value} min={0} max={100} onChange={setValue}>
   *   <Slider.Track>
   *     <Slider.Thumb />
   *   </Slider.Track>
   * </Slider.Root>
   */
  children: ReactNode
}

export interface SliderMethods {
  focus: () => void
  blur: () => void
}

type Props = SliderProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderProps>

export const Root = forwardRef<SliderMethods, Props>(
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
    const trackRef = useRef<HTMLDivElement>(null)
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

    // --- internal functions ---
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
    // The pointer is normalized against the track on both axes; only the one
    // the slider runs along is read back.
    const axis: AxisOptions = {
      min,
      max,
      step,
      skew,
      reverse: displayReversed,
    }
    const valueOf = (v: XY<number>) => v[vertical ? 1 : 0]

    const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
      axis,
      baseElementRef: trackRef,
      cursor: readonly ? undefined : externalStyles.cursor,
      updateOnPointerDown: true,
      onChange: (v) => {
        if (readonly) return
        onChange?.(valueOf(v))
      },
      onDragStart: (v) => {
        if (readonly) return
        if (externalStyles.userSelectNone) addUserSelectNone()

        thumbRef.current?.focus()
        onDragStart?.(valueOf(v))
      },
      onDragEnd: (v) => {
        if (readonly) return

        if (externalStyles.userSelectNone) removeUserSelectNone()

        onDragEnd?.(valueOf(v))
      },
    })

    const wheelRefCallback = useWheel<HTMLDivElement>((event) => {
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
    })

    // Composed once, so React attaches the refs a single time instead of
    // detaching and re-attaching on every render.
    const rootRefCallback = useComposedRefs<HTMLDivElement>(
      dragRefCallback,
      wheelRefCallback,
    )

    const context = useMemo(
      () => ({
        value,
        min,
        max,
        step,
        skew,
        vertical,
        reverse,
        disabled,
        readonly,
        percent,
        trackRef,
        thumbRef,
      }),
      [
        value,
        min,
        max,
        step,
        skew,
        vertical,
        reverse,
        disabled,
        readonly,
        percent,
      ],
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
      <SliderProvider value={context}>
        <div
          className={clsx('tremolo-slider', className)}
          ref={rootRefCallback}
          tabIndex={-1}
          role="slider"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-orientation={vertical ? 'vertical' : 'horizontal'}
          aria-disabled={disabled}
          aria-readonly={readonly}
          data-vertical={vertical}
          style={style}
          onPointerDown={onPointerDown}
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
          {children}
        </div>
      </SliderProvider>
    )
  },
)

/**
 * Customizable slider
 */
export const Slider = {
  Root,
  Thumb,
  Track,
  Scale,
  ScaleOption,
}

export { useSliderContext } from './context'
export { type SliderThumbMethods, type SliderThumbProps } from './Thumb'
export { type SliderTrackProps } from './Track'
export { type ScaleProps } from './Scale'
export { type ScaleOptionProps } from './ScaleOption'
export { type ScaleOptions, type ScaleType } from './type'
