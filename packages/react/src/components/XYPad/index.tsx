import {
  ComponentPropsWithoutRef,
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
  InputEventOptions,
  ModifierState,
  type ModifierValue,
  selectModifier,
  type Scale,
} from '@tremolo-ui/functions'

import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { addUserSelectNone, Cursor, removeUserSelectNone } from '../_util'
import { useCheckSteps } from '../_util/checkSteps'
import { useComposedRefs } from '../_util/composeRefs'
import { cx } from '../_util/cx'
import {
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
} from '../_util/inputEvent'

import { Area } from './Area'
import { toXY, XY, XYInput, XYPadProvider } from './context'
import { Thumb, XYPadThumbMethods } from './Thumb'

const defaultExternalStyles: XYPadProps['externalStyles'] = {
  userSelectNone: true,
  cursor: 'pointer',
}

/**
 * Two-dimensional slider component.
 *
 * The per-axis settings mirror `Slider`, given as `[x, y]` tuples. A plain
 * value applies to both axes.
 */
export interface XYPadProps {
  value: XY<number>
  min: XYInput<number>
  max: XYInput<number>

  step?: XYInput<number>
  /**
   * How the value of each axis is distributed across the travel.
   *
   * Pick one of the scales from `@tremolo-ui/functions`: `linearScale`,
   * `exponentialScale`, `curveScale(n)`, `symmetricSkewScale(n)`, or
   * `skewScale(n)` for a value that has to match a JUCE parameter.
   *
   * @default linearScale
   */
  scale?: XYInput<Scale>
  reverse?: XYInput<boolean>

  /**
   * wheel control option. Scrolling sideways moves x, which is what a
   * browser turns shift+wheel into.
   * If null, no event will be triggered
   */
  wheel?: InputEventOptions | null
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
  keyboard?: InputEventOptions | null

  externalStyles?: {
    userSelectNone?: boolean
    cursor?: Cursor
  }

  disabled?: boolean
  readonly?: boolean

  onChange?: (value: XY<number>) => void
  onDragStart?: (value: XY<number>) => void
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
        option: InputEventOptions,
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
        if (!onChange || readonly || !keyboard) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          const i: 0 | 1 = key === 'ArrowRight' || key === 'ArrowLeft' ? 0 : 1
          event.preventDefault()
          let direction = 1
          if (key === 'ArrowLeft' || key === 'ArrowUp') direction *= -1
          if (reverse[i]) direction *= -1
          onChange(nudge(i, direction, keyboard, event))
        }
      },
      [onChange, readonly, keyboard, reverse, nudge],
    )

    // --- hooks ---

    const hasUserSelectNone = useRef(false)

    const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
      axis,
      baseElementRef: areaRef,
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
      updateOnPointerDown: true,
      cursor: readonly ? undefined : externalStyles.cursor,
      onChange: (v) => {
        if (readonly) return
        onChange?.(v)
      },
      onDragStart: (v) => {
        if (readonly) return
        if (externalStyles.userSelectNone) {
          addUserSelectNone()
          hasUserSelectNone.current = true
        }
        thumbRef.current?.focus()
        onDragStart?.(v)
      },
      onDragEnd: (v) => {
        if (hasUserSelectNone.current) {
          hasUserSelectNone.current = false
          removeUserSelectNone()
        }
        if (readonly) return
        onDragEnd?.(v)
      },
    })

    const wheelRefCallback = useWheel<HTMLDivElement>((event) => {
      if (!onChange || readonly || !wheel) return
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
        percent,
        areaRef,
        thumbRef,
      }),
      [value, min, max, step, scale, reverse, disabled, readonly, percent],
    )

    useImperativeHandle(forwardedRef, () => {
      return {
        focus() {
          thumbRef.current?.focus()
        },
        blur() {
          thumbRef.current?.blur()
        },
        original: rootRef,
      }
    }, [])

    return (
      <XYPadProvider value={context}>
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className={cx('tremolo-xy-pad', className)}
          ref={rootRefCallback}
          tabIndex={-1}
          aria-disabled={disabled}
          aria-readonly={readonly}
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
export { useXYPadContext, type XY, type XYInput } from './context'
