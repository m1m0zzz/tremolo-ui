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
  applyDelta,
  linearScale,
  toFixed,
  InputEventOption,
  xor,
  type Scale,
} from '@tremolo-ui/functions'

import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { addUserSelectNone, Cursor, removeUserSelectNone } from '../_util'
import { useComposedRefs } from '../_util/composeRefs'

import { SliderProvider } from './context'
import { Marks } from './Marks'
import { MarksOption } from './MarksOption'
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
  /**
   * How the value is distributed across the travel.
   *
   * Pick one of the scales from `@tremolo-ui/functions`: `linearScale`,
   * `exponentialScale`, `curveScale(n)`, `symmetricSkewScale(n)`, or
   * `skewScale(n)` for a value that has to match a JUCE parameter.
   *
   * @default linearScale
   */
  scale?: Scale
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

/**
 * The wheel only acts while the focus is inside, so that scrolling a page past
 * the control does not change its value.
 */
const WHEEL_OPTIONS = { requireFocus: true }

export const Root = forwardRef<SliderMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      scale = linearScale,
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

    const p = toFixed(scale.normalize(value, min, max) * 100)
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
    // The pointer is normalized against the track on both axes; only the one
    // the slider runs along is read back. `AxisOptions` extends `ValueRange`,
    // so the same object also describes the scaling for `applyDelta`.
    const axis: AxisOptions = useMemo(
      () => ({ min, max, step, scale, reverse: displayReversed }),
      [min, max, step, scale, displayReversed],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!keyboard || !onChange || readonly) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          event.preventDefault()
          let direction = key == 'ArrowRight' || key == 'ArrowUp' ? 1 : -1
          if (reverse) direction *= -1
          onChange(applyDelta(value, direction, keyboard, axis))
        }
      },
      [keyboard, onChange, readonly, reverse, value, axis],
    )

    // --- hooks ---
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
      let direction
      if (!vertical && event.deltaX != 0) {
        direction = event.deltaX > 0 ? 1 : -1
      } else {
        if (event.deltaY == 0) return
        direction = event.deltaY > 0 ? -1 : 1
      }
      if (vertical && reverse) direction *= -1
      onChange(applyDelta(value, direction, wheel, axis))
    }, WHEEL_OPTIONS)

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
        scale,
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
        scale,
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
  Marks,
  MarksOption,
}

export { useSliderContext } from './context'
export { type SliderThumbMethods, type SliderThumbProps } from './Thumb'
export { type SliderTrackProps } from './Track'
export { type MarksProps } from './Marks'
export { type MarksOptionProps } from './MarksOption'
export { type MarksOptions, type MarksType } from './type'
