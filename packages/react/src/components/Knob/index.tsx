import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react'

import {
  clamp,
  InputEventOption,
  normalizeValue,
  radian,
  rawValue,
  stepValue,
} from '@tremolo-ui/functions'

import { useDrag } from '../../hooks/useDrag'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { addNoSelect, removeNoSelect } from '../_util'

/** @category Knob */
export interface KnobProps {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // | SkewFunction
  /**
   * value set when double-clicking
   * @default min
   * @see enableDoubleClickDefault
   */
  defaultValue?: number

  /**
   * Value to be used as the starting point of the line when drawing.
   * @default min
   */
  startValue?: number

  // TODO: relative size (Lower priority)
  size?: number

  /** Whether to apply `{use-select: none}` when dragging */
  bodyNoSelect?: boolean
  /**
   * wheel control option
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   */
  keyboard?: InputEventOption | null
  enableDoubleClickDefault?: boolean

  disabled?: boolean
  readonly?: boolean

  activeLine?: string
  inactiveLine?: string
  thumb?: string
  thumbLine?: string

  classes?: {
    activeLine?: string
    inactiveLine?: string
    thumb?: string
    thumbLine?: string
  }

  onChange?: (value: number) => void
}

/**
 * @category Knob
 */
export interface KnobMethods {
  focus: () => void
  blur: () => void
}

type Props = KnobProps & Omit<ComponentPropsWithoutRef<'svg'>, keyof KnobProps>

/**
 * Interactive rotary knob component implemented in SVG.
 *
 * @category Knob
 */
export const Knob = forwardRef<KnobMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      skew = 1,
      defaultValue = min,
      startValue = min,
      size = 50,
      bodyNoSelect = true,
      wheel = ['raw', 1],
      keyboard = ['raw', 1],
      enableDoubleClickDefault = true,
      disabled = false,
      readonly = false,
      activeLine,
      inactiveLine,
      thumb,
      thumbLine,
      onChange,
      onKeyDown,
      onPointerDown,
      onDoubleClick,
      className,
      classes,
      ...props
    }: Props,
    ref,
  ) => {
    const valueRef = useRef(0)
    const elmRef = useRef<HTMLOrSVGElement>(null)

    // --- interpret props ---
    const padding = 8 // %
    const thumbLineWeight = 6 // %
    const thumbLineLength = 35 // %
    const lineWeight = size * 0.06 // px
    const p = normalizeValue(value, min, max, skew)
    const s = normalizeValue(startValue, min, max, skew)

    // --- internal functions ---
    const onDrag = useCallback(
      (_x: number, y: number) => {
        if (!onChange || readonly) return
        const v = rawValue(valueRef.current - y / 100, min, max, skew)
        const v2 = clamp(stepValue(v, step), min, max)
        onChange(v2)
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
    const [touchMoveRefCallback, pointerDownHandler] = useDrag<SVGElement>({
      onDrag: onDrag,
      onDragStart: () => {
        valueRef.current = normalizeValue(value, min, max, skew)
        if (bodyNoSelect) addNoSelect()
      },
      onDragEnd: () => {
        if (bodyNoSelect) removeNoSelect()
      },
    })

    const wheelRefCallback = useRefCallbackEvent(
      'wheel',
      (event) => {
        if (!wheel || readonly) return
        event.preventDefault()
        if (!onChange || event.deltaY == 0) return
        const x = Math.sign(event.deltaY) * -wheel[1]
        onChange(updateValueByEvent(wheel[0], x))
      },
      { passive: false },
      [wheel, onChange, readonly, updateValueByEvent],
    )

    useImperativeHandle(ref, () => {
      return {
        focus() {
          elmRef.current?.focus()
        },
        blur() {
          elmRef.current?.blur()
        },
      }
    }, [])

    const center = size / 2
    const r1 = -135
    const r2 = -135 + Math.min(p, s) * 270
    const r3 = -135 + Math.max(p, s) * 270
    const r4 = 135
    const x1 = center + center * Math.cos(radian(r1 - 90))
    const y1 = center + center * Math.sin(radian(r1 - 90))
    const x2 = center + center * Math.cos(radian(r2 - 90))
    const y2 = center + center * Math.sin(radian(r2 - 90))
    const x3 = center + center * Math.cos(radian(r3 - 90))
    const y3 = center + center * Math.sin(radian(r3 - 90))
    const x4 = center + center * Math.cos(radian(r4 - 90))
    const y4 = center + center * Math.sin(radian(r4 - 90))

    return (
      <svg
        className={clsx('tremolo-knob', className)}
        ref={(div) => {
          elmRef.current = div
          wheelRefCallback(div)
          touchMoveRefCallback(div)
        }}
        width={size}
        height={size}
        tabIndex={0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-disabled={disabled}
        aria-readonly={readonly}
        onPointerDown={(event) => {
          pointerDownHandler(event)
          onPointerDown?.(event)
        }}
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
        {/* rotary meter */}
        {startValue > min && (
          <path
            className={clsx(
              'tremolo-knob-inactive-line',
              classes?.inactiveLine,
            )}
            d={`M ${x1} ${y1} A ${center} ${center} -135 ${r2 - r1 > 180 ? 1 : 0} 1 ${x2}, ${y2}`}
            fill="none"
            stroke={inactiveLine || 'currentColor'}
            strokeWidth={lineWeight}
          />
        )}
        <path
          className={clsx('tremolo-knob-active-line', classes?.activeLine)}
          d={`M ${x2} ${y2} A ${center} ${center} -135 ${r3 - r2 > 180 ? 1 : 0} 1 ${x3}, ${y3}`}
          fill="none"
          stroke={activeLine || 'currentColor'}
          strokeWidth={lineWeight}
        />
        {startValue < max && (
          <path
            className={clsx(
              'tremolo-knob-inactive-line',
              classes?.inactiveLine,
            )}
            d={`M ${x3} ${y3} A ${center} ${center} -135 ${r4 - r3 > 180 ? 1 : 0} 1 ${x4}, ${y4}`}
            fill="none"
            stroke={inactiveLine || 'currentColor'}
            strokeWidth={lineWeight}
          />
        )}
        {/* thumb */}
        <svg className={clsx('tremolo-knob-thumb', classes?.thumb)}>
          <circle
            cx="50%"
            cy="50%"
            r={`${50 - padding}%`}
            fill={thumb || 'currentColor'}
          />
          <line
            className={clsx('tremolo-knob-thumb-line', classes?.thumbLine)}
            x1="50%"
            y1={`${padding}%`}
            x2="50%"
            y2={`${thumbLineLength}%`}
            stroke={thumbLine || 'currentColor'}
            strokeWidth={`${thumbLineWeight}%`}
            // NOTE
            // https://bugs.webkit.org/show_bug.cgi?id=201854
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform-origin#browser_compatibility
            style={{
              transform: `rotate(${-135 + p * 270}deg)`,
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
      </svg>
    )
  },
)
