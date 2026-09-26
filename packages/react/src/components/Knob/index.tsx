import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

import {
  applyDelta,
  arrowKeyDirection,
  type AxisOptions,
  cssLength,
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
  type InputEventOption,
  knobAngles,
  type ModifierValue,
  selectModifier,
  wheelDirection,
  type XY,
} from '@tremolo-ui/dom'
import { linearScale, type Scale, type ValueRange } from '@tremolo-ui/functions'

import { useComposedRefs } from '../../compose-refs'
import { useCheckSteps } from '../../hooks/_internal/useCheckSteps'
import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'

import { ActiveLine } from './ActiveLine'
import { KnobProvider } from './context'
import { InactiveLine } from './InactiveLine'
import { SVGRoot } from './SVGRoot'
import { Thumb } from './Thumb'

import type { CSSVariables } from '../../css-variables'

const defaultExternalStyles: KnobProps['externalStyles'] = {
  cursor: 'grabbing',
}

export interface KnobProps {
  /** The current value. The knob shows only this, so update it from `onChange`. */
  value: number
  /** The value with the knob turned all the way down. */
  min: number
  /** The value with the knob turned all the way up. */
  max: number

  /**
   * Granularity of the value. A drag, the wheel and the arrow keys snap it to
   * multiples of `step`.
   *
   * @default 1
   */
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
   * The value a double click restores, while `enableDoubleClickDefault` is on.
   * @default min
   */
  defaultValue?: number

  /**
   * Where the active arc starts. Put it at the centre of a bipolar control,
   * such as a pan knob, so that the arc grows from there either way.
   * @default min
   */
  startValue?: number

  /**
   * Width and height of the knob. Sets `--knob-size`; the size the theme
   * gives it stands when this is omitted.
   */
  size?: number | string

  /**
   * The cursor to show while dragging. It is set on the dragged element, so it
   * stays while the pointer is outside the knob.
   *
   * @default { cursor: 'grabbing' }
   */
  externalStyles?: {
    cursor?: CSSProperties['cursor']
  }
  /**
   * How much one notch of the wheel moves the value. It only acts while the
   * focus is inside, so that scrolling the page past the knob leaves it alone.
   *
   * `['raw', n]` moves the value by `n`, and `['normalized', n]` by `n` of the
   * range between `min` and `max`. The result is snapped to `step`, except for
   * an amount set on a modifier key (`{ default: …, shift: … }`). `null` turns
   * the wheel off.
   *
   * @default ['raw', 1]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much a drag moves the value, per modifier key.
   *
   * `1` is the normal travel of 100px for the whole range; `0.1` makes the
   * same movement cover a tenth of it. Shift is bound to `0.1` by default, to
   * match what it does on the arrow keys.
   *
   * Pressing or releasing the key mid-drag does not disturb the value: the
   * travel so far is kept and the new sensitivity applies from there. It takes
   * effect on the next movement, since a key on its own produces no pointer
   * event.
   *
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>

  /**
   * Hide the cursor while dragging and read the pointer movement directly,
   * rather than letting it wander off across the screen.
   *
   * A knob does not care where the pointer is, only how far it moved, and
   * letting it wander costs twice: the cursor ends up far from the knob it is
   * holding, and **the drag stops at the edge of the screen**, where the
   * operating system pins the pointer and the coordinates stop changing. A
   * `dragSensitivity` below 1 reaches that edge quickly.
   *
   * Off by default because it is not free: the browser shows its own notice,
   * Esc takes the lock back, and the request needs a user gesture and can be
   * refused. A refused request is not an error — the drag simply carries on as
   * an ordinary one.
   *
   * @default false
   */
  pointerLock?: boolean

  /**
   * How much one arrow key press moves the value.
   *
   * `['raw', n]` moves the value by `n`, and `['normalized', n]` by `n` of the
   * range between `min` and `max`. The result is snapped to `step`, except for
   * an amount set on a modifier key, which is what lets shift move off the
   * grid. `null` turns the arrow keys off.
   *
   * The default moves by 1, and by 0.1 with shift. With a `step` above 1, raise
   * the amount to match: 1 would round straight back to where it started, and
   * a development build warns about it.
   *
   * @default { default: ['raw', 1], shift: ['raw', 0.1] }
   */
  keyboard?: ModifierValue<InputEventOption> | null
  /**
   * Restore `defaultValue` on a double click.
   * @default true
   */
  enableDoubleClickDefault?: boolean

  /**
   * Make the knob unchangeable and remove it from the tab order.
   * The parts carry `data-disabled` while it is set.
   */
  disabled?: boolean
  /**
   * Make the knob unchangeable while leaving it focusable.
   * The parts carry `data-readonly` while it is set.
   */
  readonly?: boolean

  /**
   * How far the knob turns from `min` to `max`, in degrees, centred on the
   * top.
   * @default 270
   */
  angleRange?: number

  /**
   * Called with the new value when a drag, the wheel, an arrow key or a double
   * click moves it.
   */
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

  style?: CSSProperties & CSSVariables<'knob-size'>
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

export const Root = /* @__PURE__ */ forwardRef<KnobMethods, Props>(
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
      wheel = DEFAULT_WHEEL_OPTIONS,
      keyboard = DEFAULT_KEYBOARD_OPTIONS,
      dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
      pointerLock = false,
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
    const inactive = disabled || readonly

    // --- internal functions ---
    const range: ValueRange = useMemo(
      () => ({ min, max, step, scale }),
      [min, max, step, scale],
    )

    useCheckSteps({ component: 'Knob', range, keyboard, wheel })

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLOrSVGElement>) => {
        if (!keyboard || !onChange || inactive) return
        const direction = arrowKeyDirection(event.key)
        if (direction === null) return
        event.preventDefault()
        onChange(applyDelta(value, direction, keyboard, range, event))
      },
      [keyboard, onChange, inactive, value, range],
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
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
      threshold: 1,
      cursor: inactive ? undefined : externalStyles.cursor,
      pointerLock: inactive ? false : pointerLock,
      shouldStart: () => !inactive,
      onChange: (v) => {
        if (inactive) return
        onChange?.(v[1])
      },
    })

    const wheelRefCallback = useWheel<HTMLElement>((event) => {
      if (!wheel || inactive) return
      event.preventDefault()
      const direction = wheelDirection(event)
      if (!onChange || direction === null) return
      onChange(applyDelta(value, direction, wheel, range, event))
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
      return { ...config, ...knobAngles(config) }
    }, [value, min, max, step, scale, startValue, angleRange])

    useImperativeHandle(forwardedRef, () => {
      return {
        focus() {
          if (!disabled) elmRef.current?.focus()
        },
        blur() {
          elmRef.current?.blur()
        },
      }
    }, [disabled])

    return (
      <KnobProvider value={context}>
        <div
          ref={rootRefCallback}
          className={className}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled}
          aria-readonly={readonly}
          data-disabled={disabled ? '' : undefined}
          data-readonly={readonly ? '' : undefined}
          data-dragging={dragging ? '' : undefined}
          style={
            {
              '--knob-size': cssLength(size),
              ...style,
            } as CSSProperties
          }
          onPointerDown={onPointerDown}
          onDoubleClick={(event) => {
            if (!inactive && enableDoubleClickDefault && onChange) {
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

export { useKnobContext, type KnobContextValue } from './context'
export { type KnobSVGRootProps } from './SVGRoot'
export { type KnobThumbProps } from './Thumb'
