import { clamp, InputEventOption, normalizeValue, radian, rawValue, stepValue } from '@tremolo-ui/functions'
import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, useCallback, useRef } from 'react'

import { useEventListener } from '../../hooks/useEventListener'
import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'

import { addNoSelect, removeNoSelect } from '../_util'

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
   * @see enableDoubleClickDefault
   */
  defaultValue?: number

  /**
   * Value to be used as the starting point of the line when drawing.
   * @default min
   */
  startValue?: number

  /** Priority over width or height */
  size?: number // | `${number}%`
  width?: number // | `${number}%`
  height?: number // | `${number}%`

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
  style?: CSSProperties
  onChange?: (value: number) => void
}

export function Knob({
  value,
  min,
  max,
  step = 1,
  skew = 1,
  defaultValue = min,
  startValue = min,
  size,
  width = 50,
  height = 50,
  bodyNoSelect = true,
  wheel = ['raw', 1],
  keyboard = ['raw', 1],
  enableDoubleClickDefault = true,
  style,
  onChange,
  className,
  ...props
}: KnobProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KnobProps>) {
  // -- state and ref ---
  const dragOffsetY = useRef<number | undefined>(undefined)

  // --- interpret props ---
  const padding = 6 // %
  const thumbWeight = 6 // %
  const thumbLength = 35 // %
  const lineWeight = 2 // px
  const p = normalizeValue(value, min, max, skew)

  // --- internal functions ---
const handleEvent = (
    event:
      | MouseEvent
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | TouchEvent,
  ) => {
    const isTouch = event instanceof TouchEvent
    if (isTouch && event.cancelable) event.preventDefault()
    if (dragOffsetY.current) {
      if (bodyNoSelect) addNoSelect()
      const screenY = isTouch ? event.touches[0].screenY : event.screenY
      const delta = dragOffsetY.current - screenY
      dragOffsetY.current = screenY
      const n = normalizeValue(value, min, max, skew)
      const v = rawValue(n + delta / 100, min, max, skew)
      const v2 = clamp(stepValue(v, step), min, max)
      if (onChange) onChange(v2)
    }
  }

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!keyboard || !onChange) return
    const key = event.key
    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
      event.preventDefault()
      const x = (key == 'ArrowRight' || key == 'ArrowUp') ? keyboard[1] : -keyboard[1]
      let v
      if (keyboard[0] == 'normalized') {
        const n = normalizeValue(value, min, max, skew)
        v = rawValue(n + x, min, max, skew)
      } else {
        v = value + x
      }
      onChange(clamp(stepValue(v, step), min, max))
    }
  }, [value, min, max, step, skew, keyboard, onChange])

  // --- hooks ---
  const wheelRefCallback = useRefCallbackEvent(
    'wheel',
    (event) => {
      if (!wheel) return
      event.preventDefault()
      const x = event.deltaY > 0 ? -wheel[1] : wheel[1]
      let v
      if (wheel[0] == 'normalized') {
        const n = normalizeValue(value, min, max, skew)
        v = rawValue(n + x, min, max, skew)
      } else {
        v = value + x
      }
      if (onChange) onChange(clamp(stepValue(v, step), min, max))
    },
    { passive: false },
    [wheel, value, min, max, skew, step, onChange],
  )

  const touchMoveRefCallback = useRefCallbackEvent(
    'touchmove',
    handleEvent,
    { passive: false },
    [value, min, max, skew, step, onChange, bodyNoSelect],
  )

  useEventListener(window, 'mousemove', handleEvent)

  useEventListener(window, 'pointerup', () => {
    dragOffsetY.current = undefined
    if (bodyNoSelect) removeNoSelect()
  })

  const cx = width / 2
  const cy = height / 2
  const x1 = cx + (cx) * Math.cos(radian(-135 - 90))
  const y1 = cy + (cy) * Math.sin(radian(-135 - 90))
  const x2 = cx + (cx) * Math.cos(radian(-135 + p * 270 - 90))
  const y2 = cy + (cy) * Math.sin(radian(-135 + p * 270 - 90))
  const x3 = cx + (cx) * Math.cos(radian(135 - 90))
  const y3 = cy + (cy) * Math.sin(radian(135 - 90))

  return (
    <div
      className={clsx('tremolo-knob', className)}
      ref={(div) => {
        wheelRefCallback(div)
        touchMoveRefCallback(div)
      }}
      style={{
        display: 'inline-block',
        width: size ?? width,
        height: size ?? height,
        ...style
      }}
      onPointerDown={(event) => {
        dragOffsetY.current = event.screenY
        handleEvent(event)
      }}
      onDoubleClick={() => {
        if (enableDoubleClickDefault && onChange) {
          onChange(defaultValue)
        }
      }}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      {...props}
    >
      <svg
        width={size ?? width}
        height={size ?? height}
        style={{
          overflow: 'visible'
        }}
      >
        {/* rotary meter */}
        <path
          d={`M ${x1} ${y1} A ${cx} ${cy} -135 ${45 < -135 + p * 270 ? 1 : 0} 1 ${x2}, ${y2}`}
          fill='none'
          stroke='#4e76e6'
          strokeWidth={lineWeight}
        />
        <path
          d={`M ${x2} ${y2} A ${cx} ${cy} -135 ${-45 < -135 + p * 270 ? 0 : 1} 1 ${x3}, ${y3}`}
          fill='none'
          stroke='#ccc'
          strokeWidth={lineWeight}
        />
        {/* thumb */}
        <svg
          className='tremolo-knob-thumb'
          style={{
            color: '#ccc',
            // filter: 'drop-shadow(5px 5px 10px rgba(0, 0, 0, 0.3)',
          }}
        >
          <circle
            cx='50%'
            cy='50%'
            r={`${50 - padding}%`}
            fill='currentColor'
          />
          <line
            x1='50%'
            y1={`${padding}%`}
            x2='50%'
            y2={`${thumbLength}%`}
            stroke='#eee'
            strokeWidth={`${thumbWeight}%`}
            transform={`rotate(${-135 + p * 270})`}
            transform-origin='50% 50%'
          />
        </svg>
      </svg>
    </div>
  )
}
