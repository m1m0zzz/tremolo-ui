import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
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
  InputEventOption,
  linearScale,
  type Scale,
  type ValueRange,
} from '@tremolo-ui/functions'

import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { addUserSelectNone, Cursor, removeUserSelectNone } from '../_util'
import { useComposedRefs } from '../_util/composeRefs'

import { ActiveLine } from './ActiveLine'
import { calcAngles, KnobProvider } from './context'
import { InactiveLine } from './InactiveLine'
import { SVGRoot } from './SVGRoot'
import { Thumb } from './Thumb'

const defaultExternalStyles: KnobProps['externalStyles'] = {
  userSelectNone: true,
  cursor: 'grabbing',
}

export interface KnobProps {
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
   * value set when double-clicking
   * restriction: enableDoubleClickDefault = true
   * @default min
   * @see enableDoubleClickDefault
   */
  defaultValue?: number

  /**
   * Value to be used as the starting point of the line when drawing.
   * @default min
   */
  startValue?: number

  /** width and height */
  /**
   * Width and height of the knob.
   * Defaults to the `--knob-size` CSS variable (50px).
   */
  size?: number | string

  /**
   * Global style to apply when dragged
   * @default defaultExternalStyles
   */
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
  enableDoubleClickDefault?: boolean

  disabled?: boolean
  readonly?: boolean

  /** angle range [degree] */
  angleRange?: number

  onChange?: (value: number) => void

  /**
   * The knob renders exactly what you compose here; there is no default
   * markup to fall back to.
   *
   * @example
   * <Knob.Root value={value} min={0} max={100} onChange={setValue}>
   *   <Knob.SVGRoot>
   *     <Knob.InactiveLine />
   *     <Knob.ActiveLine />
   *     <Knob.Thumb />
   *   </Knob.SVGRoot>
   * </Knob.Root>
   */
  children: ReactNode
}

export interface KnobMethods {
  focus: () => void
  blur: () => void
}

type Props = KnobProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KnobProps>

/**
 * The wheel only acts while the focus is inside, so that scrolling a page past
 * the control does not change its value.
 */
const WHEEL_OPTIONS = { requireFocus: true }

export const Root = forwardRef<KnobMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      scale = linearScale,
      defaultValue = min,
      startValue = min,
      size,
      externalStyles: _externalStyles,
      wheel = ['raw', 1],
      keyboard = ['raw', 1],
      enableDoubleClickDefault = true,
      disabled = false,
      readonly = false,
      angleRange = 270,
      onChange,
      onKeyDown,
      onPointerDown,
      onDoubleClick,
      className,
      style,
      children,
      ...props
    }: Props,
    forwardedRef,
  ) => {
    const elmRef = useRef<HTMLElement | SVGElement>(null)

    const externalStyles = { ...defaultExternalStyles, ..._externalStyles }

    // --- internal functions ---
    const range: ValueRange = useMemo(
      () => ({ min, max, step, scale }),
      [min, max, step, scale],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLOrSVGElement>) => {
        if (!keyboard || !onChange || readonly) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          event.preventDefault()
          const direction = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : -1
          onChange(applyDelta(value, direction, keyboard, range))
        }
      },
      [keyboard, onChange, readonly, value, range],
    )

    // --- hooks ---
    // The knob has no travel of its own: the value moves away from where it
    // stood when the drag started, 100px of movement spanning the whole range.
    // Only the vertical axis carries a value, reversed so that dragging up
    // raises it.
    const axis = useMemo(
      (): XY<AxisOptions> => [range, { ...range, reverse: true }],
      [range],
    )

    const { refCallback: dragRefCallback, dragging } = useDragValue<
      HTMLElement | SVGElement
    >({
      axis,
      getValue: () => [value, value],
      threshold: 1,
      cursor: readonly ? undefined : externalStyles.cursor,
      onChange: (v) => {
        if (readonly) return
        onChange?.(v[1])
      },
      onDragStart: () => {
        if (externalStyles.userSelectNone) addUserSelectNone()
      },
      onDragEnd: () => {
        if (externalStyles.userSelectNone) removeUserSelectNone()
      },
    })

    const wheelRefCallback = useWheel<HTMLElement>((event) => {
      if (!wheel || readonly) return
      event.preventDefault()
      if (!onChange || event.deltaY === 0) return
      onChange(applyDelta(value, -Math.sign(event.deltaY), wheel, range))
    }, WHEEL_OPTIONS)

    // Composed once, so React attaches the refs a single time instead of
    // detaching and re-attaching on every render.
    const rootRefCallback = useComposedRefs<HTMLElement | SVGElement>(
      elmRef,
      dragRefCallback,
      wheelRefCallback,
    )

    const context = useMemo(() => {
      const config = { value, min, max, step, scale, startValue, angleRange }
      return { ...config, ...calcAngles(config) }
    }, [value, min, max, step, scale, startValue, angleRange])

    useImperativeHandle(forwardedRef, () => {
      return {
        focus() {
          elmRef.current?.focus()
        },
        blur() {
          elmRef.current?.blur()
        },
      }
    }, [])

    return (
      <KnobProvider value={context}>
        <div
          ref={rootRefCallback}
          className={clsx('tremolo-knob', className)}
          tabIndex={0}
          role="slider"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled}
          aria-readonly={readonly}
          data-dragging={dragging}
          style={{
            width: size,
            height: size,
            ...style,
          }}
          onPointerDown={onPointerDown}
          onDoubleClick={(event) => {
            if (enableDoubleClickDefault && onChange) {
              onChange(defaultValue)
            }
            onDoubleClick?.(event)
          }}
          onKeyDown={(event) => {
            handleKeyDown(event)
            onKeyDown?.(event)
          }}
          {...props}
        >
          {children}
        </div>
      </KnobProvider>
    )
  },
)

/**
 * Interactive rotary knob component implemented in SVG.
 */
export const Knob = {
  Root,
  SVGRoot,
  InactiveLine,
  ActiveLine,
  Thumb,
}

export { useKnobContext } from './context'
