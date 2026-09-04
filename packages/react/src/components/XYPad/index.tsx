import clsx from 'clsx'
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
  normalizeValue,
  toFixed,
  InputEventOption,
} from '@tremolo-ui/functions'

import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { addUserSelectNone, Cursor, removeUserSelectNone } from '../_util'
import { useComposedRefs } from '../_util/composeRefs'

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
  skew?: XYInput<number>
  reverse?: XYInput<boolean>

  /**
   * wheel control option. Shift selects the x axis.
   * If null, no event will be triggered
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   * If null, no event will be triggered
   */
  keyboard?: InputEventOption | null

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

export const Root = forwardRef<XYPadMethods, Props>(
  (
    {
      value,
      min: _min,
      max: _max,
      step: _step = 1,
      skew: _skew = 1,
      reverse: _reverse = false,
      wheel = ['raw', 1],
      keyboard = ['raw', 1],
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
    const skew = useMemo(() => toXY(_skew), [_skew])
    const reverse = useMemo(() => toXY(_reverse), [_reverse])

    const percent = useMemo((): XY<number> => {
      const normalized = [0, 1].map((i) =>
        normalizeValue(value[i], min[i], max[i], skew[i]),
      )
      return [0, 1].map((i) =>
        toFixed((reverse[i] ? 1 - normalized[i] : normalized[i]) * 100),
      ) as XY<number>
    }, [value, min, max, skew, reverse])

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
          skew: skew[i],
          reverse: reverse[i],
        })) as XY<AxisOptions>,
      [min, max, step, skew, reverse],
    )

    const withAxis = useCallback(
      (axis: 0 | 1, next: number): XY<number> =>
        axis == 0 ? [next, value[1]] : [value[0], next],
      [value],
    )

    /** @param i 0 = x, 1 = y */
    const nudge = useCallback(
      (i: 0 | 1, direction: number, option: InputEventOption): XY<number> =>
        withAxis(i, applyDelta(value[i], direction, option, axis[i])),
      [value, axis, withAxis],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onChange || readonly || !keyboard) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          const i: 0 | 1 = key == 'ArrowRight' || key == 'ArrowLeft' ? 0 : 1
          event.preventDefault()
          let direction = 1
          if (key == 'ArrowLeft' || key == 'ArrowUp') direction *= -1
          if (reverse[i]) direction *= -1
          onChange(nudge(i, direction, keyboard))
        }
      },
      [onChange, readonly, keyboard, reverse, nudge],
    )

    // --- hooks ---

    const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
      axis,
      baseElementRef: areaRef,
      updateOnPointerDown: true,
      cursor: readonly ? undefined : externalStyles.cursor,
      onChange: (v) => {
        if (readonly) return
        onChange?.(v)
      },
      onDragStart: (v) => {
        if (readonly) return
        if (externalStyles.userSelectNone) addUserSelectNone()
        thumbRef.current?.focus()
        onDragStart?.(v)
      },
      onDragEnd: (v) => {
        if (readonly) return
        if (externalStyles.userSelectNone) removeUserSelectNone()
        onDragEnd?.(v)
      },
    })

    const wheelRefCallback = useWheel<HTMLDivElement>((event) => {
      if (!onChange || readonly || !wheel) return
      const i: 0 | 1 = event.shiftKey ? 0 : 1
      event.preventDefault()
      let direction = 1
      if (event.deltaY < 0) direction *= -1
      if (reverse[i]) direction *= -1
      onChange(nudge(i, direction, wheel))
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
        skew,
        reverse,
        disabled,
        readonly,
        percent,
        areaRef,
        thumbRef,
      }),
      [value, min, max, step, skew, reverse, disabled, readonly, percent],
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
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className={clsx('tremolo-xy-pad', className)}
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
