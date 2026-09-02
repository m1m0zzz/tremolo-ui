import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  clamp,
  InputEventOption,
  normalizeValue,
  rawValue,
  stepValue,
} from '@tremolo-ui/functions'

import { useDrag } from '../../hooks/useDrag'
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
  skew?: number // | SkewFunction // TODO
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

const Root = forwardRef<KnobMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      skew = 1,
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
    const [dragging, setDragging] = useState(false)
    const valueRef = useRef(0)
    const elmRef = useRef<HTMLElement | SVGElement>(null)

    const externalStyles = { ...defaultExternalStyles, ..._externalStyles }

    // --- internal functions ---
    const onDrag = useCallback(
      (_x: number, y: number) => {
        if (!onChange || readonly) return
        const v = rawValue(valueRef.current - y / 100, min, max, skew)
        const clamped = clamp(stepValue(v, step), min, max)
        onChange(clamped)
      },
      [max, min, onChange, readonly, skew, step],
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
      (event: React.KeyboardEvent<HTMLOrSVGElement>) => {
        if (!keyboard || !onChange || readonly) return
        const key = event.key
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
          event.preventDefault()
          const x =
            key == 'ArrowRight' || key == 'ArrowUp' ? keyboard[1] : -keyboard[1]
          onChange(updateValueByEvent(keyboard[0], x))
        }
      },
      [keyboard, onChange, readonly, updateValueByEvent],
    )

    // --- hooks ---
    const dragRefCallback = useDrag<HTMLElement | SVGElement>({
      cursor: readonly ? undefined : externalStyles.cursor,
      onDrag: onDrag,
      onDragStart: () => {
        setDragging(true)
        valueRef.current = normalizeValue(value, min, max, skew)
        if (externalStyles.userSelectNone) addUserSelectNone()
      },
      onDragEnd: () => {
        setDragging(false)
        if (externalStyles.userSelectNone) removeUserSelectNone()
      },
    })

    const wheelRefCallback = useWheel<HTMLElement>((event) => {
      if (!wheel || readonly) return
      event.preventDefault()
      if (!onChange || event.deltaY == 0) return
      const x = Math.sign(event.deltaY) * -wheel[1]
      onChange(updateValueByEvent(wheel[0], x))
    })

    // Composed once, so React attaches the refs a single time instead of
    // detaching and re-attaching on every render.
    const rootRefCallback = useComposedRefs<HTMLElement | SVGElement>(
      elmRef,
      dragRefCallback,
      wheelRefCallback,
    )

    const context = useMemo(() => {
      const config = { value, min, max, step, skew, startValue, angleRange }
      return { ...config, ...calcAngles(config) }
    }, [value, min, max, step, skew, startValue, angleRange])

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
