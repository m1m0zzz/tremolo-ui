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

  /** width and height */
  size?: number | string

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

  /** color */
  activeLine?: string
  /** color */
  inactiveLine?: string
  /** color */
  thumb?: string
  /** color */
  thumbLine?: string
  /** percent (0-100) */
  thumbSize?: number
  /** percent (0-100) */
  thumbLineWeight?: number
  /** percent (0-100) */
  thumbLineLength?: number
  /** line weight [px] */
  lineWeight?: number
  /** angle range [degree] */
  angleRange?: number

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
      thumbSize = 84,
      thumbLineWeight = 6,
      thumbLineLength = 35,
      lineWeight = 6,
      angleRange = 270,
      onChange,
      onKeyDown,
      onPointerDown,
      onDoubleClick,
      className,
      classes,
      ...props
    }: Props,
    forwardedRef,
  ) => {
    const valueRef = useRef(0)
    const elmRef = useRef<HTMLOrSVGElement>(null)

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

    const viewBoxSize = 100
    const center = viewBoxSize / 2
    const padding = (viewBoxSize - clamp(thumbSize, 0, 100)) / 2 // %
    const p = normalizeValue(value, min, max, skew)
    const s = normalizeValue(startValue, min, max, skew)

    // 時計回りで描画していく
    const r1 = -angleRange / 2 // ロータリー開始位置
    const r2 = r1 + Math.min(p, s) * angleRange // activeLineの開始位置
    const r3 = r1 + Math.max(p, s) * angleRange // activeLineの終了位置
    const r4 = angleRange / 2 // ロータリー終了位置
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
        ref={(div) => {
          elmRef.current = div
          wheelRefCallback(div)
          touchMoveRefCallback(div)
        }}
        className={clsx('tremolo-knob', className)}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width={size}
        height={size}
        tabIndex={0}
        role="slider"
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
        {/* lines */}
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
            r={`${thumbSize / 2}%`}
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
              transform: `rotate(${r1 + p * angleRange}deg)`,
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
      </svg>
    )
  },
)
