import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  Ref,
  useImperativeHandle,
  useRef,
} from 'react'

import { cx } from '../_util/cx'
import { useCheckPlacement } from '../_util/placement'
import { VisuallyHiddenRangeInput } from '../_util/VisuallyHiddenRangeInput'

import { useXYPadContext } from './context'

export interface XYPadThumbProps {
  /**
   * Size comes from the `--thumb-size` CSS variable on `XYPad.Root`, so that
   * the root can reserve the matching amount of space around the area.
   */
  color?: string

  className?: string
  style?: CSSProperties
  /**
   * Rendered inside the thumb. The thumb is one element either way, so what
   * is passed here is decoration on top of it rather than a replacement for
   * it — `className` and `style` are how its own appearance is changed.
   */
  children?: ReactNode
  ref?: Ref<XYPadThumbMethods>
}

export interface XYPadThumbMethods {
  focus: () => void
  blur: () => void
}

type Props = XYPadThumbProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadThumbProps>

export function Thumb({
  color,
  children,
  className,
  style,
  ref,
  ...props
}: Props) {
  const xInputRef = useRef<HTMLInputElement>(null)
  const yInputRef = useRef<HTMLInputElement>(null)
  const {
    value,
    min,
    max,
    step,
    disabled,
    readonly,
    onChange,
    ariaLabels,
    ariaValueText,
    percent,
    thumbRef,
  } = useXYPadContext()

  // The thumb is positioned against the area.
  useCheckPlacement('XYPad.Thumb', 'XYPad.Area')

  const methods = () => ({
    focus() {
      if (!disabled) xInputRef.current?.focus()
    },
    blur() {
      xInputRef.current?.blur()
      yInputRef.current?.blur()
    },
  })

  useImperativeHandle(ref, methods, [disabled])
  // Root focuses the thumb when a drag starts, wherever the user placed it.
  useImperativeHandle(thumbRef, methods, [disabled])

  return (
    <div
      className={cx('tremolo-xy-pad-thumb', className)}
      aria-disabled={disabled}
      aria-readonly={readonly}
      {...props}
      style={{
        ...{ '--color': color },
        ...style,
        // Where the thumb sits is the component's decision, not a style: a
        // `left` from the caller would take it off the area, so it is written
        // after theirs.
        left: `${percent[0]}%`,
        top: `${percent[1]}%`,
      }}
    >
      {([0, 1] as const).map((axis) => (
        <VisuallyHiddenRangeInput
          key={axis}
          ref={axis === 0 ? xInputRef : yInputRef}
          className={`tremolo-xy-pad-${axis === 0 ? 'x' : 'y'}-input`}
          data-axis={axis}
          value={value[axis]}
          min={min[axis]}
          max={max[axis]}
          step={step[axis]}
          disabled={disabled}
          aria-readonly={readonly}
          aria-orientation={axis === 0 ? 'horizontal' : 'vertical'}
          aria-label={ariaLabels[axis]}
          aria-valuetext={ariaValueText?.[axis]}
          onChange={(event) => {
            if (readonly) {
              event.currentTarget.value = String(value[axis])
              return
            }
            const next = [...value] as [number, number]
            next[axis] = event.currentTarget.valueAsNumber
            onChange?.(next)
          }}
        />
      ))}
      {children}
    </div>
  )
}
