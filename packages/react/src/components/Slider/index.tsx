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
  type InputEventOption,
  type ModifierValue,
  selectModifier,
  xor,
  type Scale,
} from '@tremolo-ui/functions'

import { useComposedRefs } from '../../compose-refs'
import { useCheckSteps } from '../../hooks/_internal/useCheckSteps'
import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import {
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
} from '../../input-event'
import { cx } from '../_util/cx'

import { SliderProvider } from './context'
import { Marks } from './Marks'
import { MarksOption } from './MarksOption'
import { Thumb, SliderThumbMethods } from './Thumb'
import { Track } from './Track'

const defaultExternalStyles: SliderProps['externalStyles'] = {
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

  /** CSS cursor applied while dragging. */
  externalStyles?: {
    cursor?: CSSProperties['cursor']
  }
  /**
   * wheel control option
   * If null, no event will be triggered
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much a drag moves the value, per modifier key.
   *
   * `1` is the pointer position itself, which is what a drag normally is here.
   * **Anything else turns the drag relative**: `0.1` makes the same movement
   * cover a tenth of the travel, so the value stops following the pointer and
   * starts moving a tenth as fast. Shift is bound to `0.1` by default, to
   * match what it does on the arrow keys.
   *
   * Pressing or releasing the key mid-drag does not disturb the value: the
   * travel so far is kept and the new sensitivity applies from there. **The
   * pointer and the value stay apart for the rest of the drag** — snapping
   * them back together on release would move the value nobody asked to move.
   *
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>

  /**
   * How much one arrow key press moves the value.
   *
   * Shift moves a tenth of a step by default. Name a modifier to change that,
   * or pass a bare `['raw', 1]` to use no modifier at all. A modifier amount
   * is not snapped to `step`.
   *
   * If null, no event will be triggered
   */
  keyboard?: ModifierValue<InputEventOption> | null

  /**
   * Make the slider unchangeable and remove it from the tab order.
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
   *     <Slider.Thumb aria-label="Level" />
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

export const Root = /* @__PURE__ */ forwardRef<SliderMethods, Props>(
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
      wheel = DEFAULT_WHEEL_OPTIONS,
      keyboard = DEFAULT_KEYBOARD_OPTIONS,
      dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
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
    const inactive = disabled || readonly

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

    useCheckSteps({ component: 'Slider', range: axis, keyboard, wheel })

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        const key = event.key
        if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key))
          return
        event.preventDefault()
        if (!keyboard || !onChange || inactive) return
        let direction = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : -1
        if (reverse) direction *= -1
        onChange(applyDelta(value, direction, keyboard, axis, event))
      },
      [keyboard, onChange, inactive, reverse, value, axis],
    )

    // --- hooks ---
    const valueOf = (v: XY<number>) => v[vertical ? 1 : 0]

    const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
      axis,
      baseElementRef: trackRef,
      cursor: inactive ? undefined : externalStyles.cursor,
      shouldStart: () => !inactive,
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
      updateOnPointerDown: true,
      onChange: (v) => {
        if (inactive) return
        onChange?.(valueOf(v))
      },
      onDragStart: (v) => {
        if (inactive) return
        thumbRef.current?.focus()
        onDragStart?.(valueOf(v))
      },
      onDragEnd: (v) => {
        if (inactive) return
        onDragEnd?.(valueOf(v))
      },
    })

    const wheelRefCallback = useWheel<HTMLDivElement>((event) => {
      if (!wheel || !onChange || inactive) return
      event.preventDefault()
      let direction
      if (!vertical && event.deltaX !== 0) {
        direction = event.deltaX > 0 ? 1 : -1
      } else {
        if (event.deltaY === 0) return
        direction = event.deltaY > 0 ? -1 : 1
      }
      if (reverse) direction *= -1
      onChange(applyDelta(value, direction, wheel, axis, event))
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
        onChange,
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
        onChange,
        percent,
      ],
    )

    useImperativeHandle(forwardedRef, () => {
      return {
        focus() {
          if (!disabled) thumbRef.current?.focus()
        },
        blur() {
          thumbRef.current?.blur()
        },
      }
    }, [disabled])

    return (
      <SliderProvider value={context}>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the group is the pointer and keyboard event area, while the nested range input carries its control semantics */}
        <div
          className={cx('tremolo-slider', className)}
          ref={rootRefCallback}
          role="group"
          // A press lands on the track or the thumb, neither of which can hold
          // focus, and the browser answers that by clearing the focus to the
          // body — undoing the focus the drag just gave the input. Taking the
          // focus here keeps it inside, and `onFocus` passes it to the input.
          tabIndex={-1}
          data-orientation={vertical ? 'vertical' : 'horizontal'}
          data-disabled={disabled}
          data-readonly={readonly}
          style={style}
          onPointerDown={onPointerDown}
          onKeyDown={(event) => {
            handleKeyDown(event)
            onKeyDown?.(event)
          }}
          onFocus={(event) => {
            if (!disabled) thumbRef.current?.focus()
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
export { type MarksOptions } from './type'
