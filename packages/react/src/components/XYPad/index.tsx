import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

import type { AxisOptions } from '@tremolo-ui/dom'
import {
  applyDelta,
  linearScale,
  toFixed,
  InputEventOption,
  ModifierState,
  type ModifierValue,
  selectModifier,
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

import { Area } from './Area'
import { toXY, XY, XYInput, XYPadProvider } from './context'
import { Thumb, XYPadThumbMethods } from './Thumb'

const defaultExternalStyles: XYPadProps['externalStyles'] = {
  cursor: 'pointer',
}

/**
 * Two-dimensional slider component.
 *
 * The per-axis settings mirror `Slider`, given as `[x, y]` tuples. A plain
 * value applies to both axes.
 */
export interface XYPadProps {
  /** The current value as `[x, y]`. The pad shows only this, so update it from `onChange`. */
  value: XY<number>
  /** The value at the start of each axis, as `[x, y]` or one number for both. */
  min: XYInput<number>
  /** The value at the end of each axis, as `[x, y]` or one number for both. */
  max: XYInput<number>

  /**
   * Granularity of each axis, as `[x, y]` or one number for both. A drag, the
   * wheel and the arrow keys snap the value to multiples of it.
   *
   * @default 1
   */
  step?: XYInput<number>
  /**
   * How the value of each axis is distributed across the travel, as `[x, y]`
   * or one scale for both.
   *
   * Pick one of the scales from `@tremolo-ui/functions`: `linearScale`,
   * `exponentialScale`, `curveScale(n)`, `symmetricSkewScale(n)`, or
   * `skewScale(n)` for a value that has to match a JUCE parameter.
   *
   * @default linearScale
   */
  scale?: XYInput<Scale>
  /**
   * Grow an axis the other way, as `[x, y]` or one for both. By default x grows
   * rightwards and y downwards. The arrow keys follow the direction on screen.
   *
   * @default false
   */
  reverse?: XYInput<boolean>

  /**
   * How much one notch of the wheel moves the value. It only acts while the
   * focus is inside, so that scrolling the page past the pad leaves it alone.
   * Scrolling sideways, or with shift held, moves x; otherwise it moves y.
   *
   * `['raw', n]` moves the value by `n`, and `['normalized', n]` by `n` of the
   * range of that axis. The result is snapped to `step`, except for an amount
   * set on a modifier key (`{ default: …, alt: … }`). `null` turns the wheel
   * off.
   *
   * @default ['raw', 1]
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
   * How much one arrow key press moves the value. Left and right move x, up
   * and down move y.
   *
   * `['raw', n]` moves the value by `n`, and `['normalized', n]` by `n` of the
   * range of that axis. The result is snapped to `step`, except for an amount
   * set on a modifier key, which is what lets shift move off the grid. `null`
   * turns the arrow keys off.
   *
   * The default moves by 1, and by 0.1 with shift. With a `step` above 1, raise
   * the amount to match: 1 would round straight back to where it started, and
   * a development build warns about it.
   *
   * @default { default: ['raw', 1], shift: ['raw', 0.1] }
   */
  keyboard?: ModifierValue<InputEventOption> | null

  /**
   * The cursor to show while dragging. It is set on the dragged element, so it
   * stays while the pointer is outside the pad.
   *
   * @default { cursor: 'pointer' }
   */
  externalStyles?: {
    cursor?: CSSProperties['cursor']
  }

  /**
   * Make the pad unchangeable and remove its thumb from the tab order.
   * The parts carry `data-disabled` while it is set.
   */
  disabled?: boolean
  /**
   * Make the pad unchangeable while leaving its thumb focusable.
   * The parts carry `data-readonly` while it is set.
   */
  readonly?: boolean

  /** Called with the new value when a drag, the wheel or an arrow key moves it. */
  onChange?: (value: XY<number>) => void
  /** Called when a drag starts, with the value where the area was pressed. */
  onDragStart?: (value: XY<number>) => void
  /** Called when the drag ends, with the value it ended on. */
  onDragEnd?: (value: XY<number>) => void

  /**
   * The pad renders exactly what you compose here; there is no default
   * markup to fall back to.
   *
   * @example
   * <XYPad.Root value={[x, y]} min={0} max={100} onChange={setValue}>
   *   <XYPad.Area>
   *     <XYPad.Thumb />
   *   </XYPad.Area>
   * </XYPad.Root>
   */
  children: ReactNode
}

export interface XYPadMethods {
  focus: () => void
  blur: () => void
  original: Ref<HTMLDivElement>
}

type Props = XYPadProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadProps>

/**
 * The wheel only acts while the focus is inside, so that scrolling a page past
 * the control does not change its value.
 */
const WHEEL_OPTIONS = { requireFocus: true }

export const Root = /* @__PURE__ */ forwardRef<XYPadMethods, Props>(
  (
    {
      value,
      min: _min,
      max: _max,
      step: _step = 1,
      scale: _scale = linearScale,
      reverse: _reverse = false,
      wheel = DEFAULT_WHEEL_OPTIONS,
      keyboard = DEFAULT_KEYBOARD_OPTIONS,
      dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
      className,
      style,
      externalStyles: _externalStyles,
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
    // -- state and ref ---
    const rootRef = useRef<HTMLDivElement>(null)
    const areaRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<XYPadThumbMethods>(null)

    // --- interpret props ---
    const externalStyles = { ...defaultExternalStyles, ..._externalStyles }
    const inactive = disabled || readonly

    const min = useMemo(() => toXY(_min), [_min])
    const max = useMemo(() => toXY(_max), [_max])
    const step = useMemo(() => toXY(_step), [_step])
    const scale = useMemo(() => toXY(_scale), [_scale])
    const reverse = useMemo(() => toXY(_reverse), [_reverse])

    const percent = useMemo((): XY<number> => {
      const normalized = [0, 1].map((i) =>
        scale[i].normalize(value[i], min[i], max[i]),
      )
      return [0, 1].map((i) =>
        toFixed((reverse[i] ? 1 - normalized[i] : normalized[i]) * 100),
      ) as XY<number>
    }, [value, min, max, scale, reverse])

    // --- internal functions ---
    // `AxisOptions` extends `ValueRange`, so the same pair also describes the
    // scaling for `applyDelta`. Its `reverse` only concerns the drag, where
    // positions follow the screen; the key and wheel handlers below flip the
    // direction themselves.
    const axis = useMemo(
      (): XY<AxisOptions> =>
        [0, 1].map((i) => ({
          min: min[i],
          max: max[i],
          step: step[i],
          scale: scale[i],
          reverse: reverse[i],
        })) as XY<AxisOptions>,
      [min, max, step, scale, reverse],
    )

    useCheckSteps({
      component: 'XYPad',
      axis: 'x',
      range: axis[0],
      keyboard,
      wheel,
    })
    useCheckSteps({
      component: 'XYPad',
      axis: 'y',
      range: axis[1],
      keyboard,
      wheel,
    })

    const withAxis = useCallback(
      (axis: 0 | 1, next: number): XY<number> =>
        axis === 0 ? [next, value[1]] : [value[0], next],
      [value],
    )

    /** @param i 0 = x, 1 = y */
    const nudge = useCallback(
      (
        i: 0 | 1,
        direction: number,
        option: ModifierValue<InputEventOption>,
        modifiers: ModifierState,
      ): XY<number> =>
        withAxis(
          i,
          applyDelta(value[i], direction, option, axis[i], modifiers),
        ),
      [value, axis, withAxis],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        const key = event.key
        if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key))
          return

        // The key picks the axis, whichever of the two inputs holds the
        // focus: the pad is one control to the person moving it, and the focus
        // lands on the x input, so reading the axis off the input would leave
        // the y axis with no keys at all.
        const i: 0 | 1 = key === 'ArrowRight' || key === 'ArrowLeft' ? 0 : 1
        event.preventDefault()
        if (!onChange || inactive || !keyboard) return
        let direction = 1
        if (key === 'ArrowLeft' || key === 'ArrowUp') direction *= -1
        if (reverse[i]) direction *= -1
        onChange(nudge(i, direction, keyboard, event))
      },
      [onChange, inactive, keyboard, reverse, nudge],
    )

    // --- hooks ---

    const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
      axis,
      baseElementRef: areaRef,
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
      updateOnPointerDown: true,
      cursor: inactive ? undefined : externalStyles.cursor,
      shouldStart: () => !inactive,
      onChange: (v) => {
        if (inactive) return
        onChange?.(v)
      },
      onDragStart: (v) => {
        if (inactive) return
        thumbRef.current?.focus()
        onDragStart?.(v)
      },
      onDragEnd: (v) => {
        if (inactive) return
        onDragEnd?.(v)
      },
    })

    const wheelRefCallback = useWheel<HTMLDivElement>((event) => {
      if (!onChange || inactive || !wheel) return
      // Browsers turn shift+wheel into horizontal scrolling: `deltaY` comes
      // out empty and `deltaX` carries the movement. Reading whichever axis
      // moved keeps shift working as the x-axis modifier — and picks up a
      // trackpad's own horizontal gesture, which never had a modifier.
      const horizontal = event.deltaX !== 0
      const delta = horizontal ? event.deltaX : event.deltaY
      if (delta === 0) return
      const i: 0 | 1 = horizontal || event.shiftKey ? 0 : 1
      event.preventDefault()
      let direction = 1
      if (delta < 0) direction *= -1
      if (reverse[i]) direction *= -1
      onChange(nudge(i, direction, wheel, event))
    }, WHEEL_OPTIONS)

    // Composed once, so React attaches the refs a single time instead of
    // detaching and re-attaching on every render.
    const rootRefCallback = useComposedRefs<HTMLDivElement>(
      rootRef,
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
        reverse,
        disabled,
        readonly,
        onChange,
        percent,
        areaRef,
        thumbRef,
      }),
      [
        value,
        min,
        max,
        step,
        scale,
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
        original: rootRef,
      }
    }, [disabled])

    return (
      <XYPadProvider value={context}>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the group handles pointer and keyboard input shared by its two range controls */}
        <div
          className={className}
          ref={rootRefCallback}
          role="group"
          tabIndex={-1}
          data-disabled={disabled || undefined}
          data-readonly={readonly || undefined}
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
      </XYPadProvider>
    )
  },
)

/**
 * Simple XYPad
 */
export const XYPad = {
  Root,
  Thumb,
  Area,
}

export { type XYPadThumbProps, type XYPadThumbMethods } from './Thumb'
export { type XYPadAreaProps } from './Area'
export {
  useXYPadContext,
  type XYPadContextValue,
  type XY,
  type XYInput,
} from './context'
