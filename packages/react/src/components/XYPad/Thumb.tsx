import {
  AriaAttributes,
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react'

import { cx } from '../_util/cx'
import { useCheckPlacement } from '../_util/Placement'
import { VisuallyHiddenRangeInput } from '../_util/VisuallyHiddenRangeInput'

import { toXY, useXYPadContext, type XYInput } from './context'

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

  /**
   * The accessible name of each axis. There are two range inputs inside the
   * thumb, so this takes one name per axis; a single string names them both,
   * which is rarely what you want.
   */
  'aria-label'?: XYInput<AriaAttributes['aria-label']>
  'aria-labelledby'?: XYInput<AriaAttributes['aria-labelledby']>
  'aria-describedby'?: XYInput<AriaAttributes['aria-describedby']>
  /** What the value of each axis means, when the number does not say it. */
  'aria-valuetext'?: XYInput<AriaAttributes['aria-valuetext']>
}

export interface XYPadThumbMethods {
  focus: () => void
  blur: () => void
}

type Props = XYPadThumbProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadThumbProps>

export const Thumb = /* @__PURE__ */ forwardRef<XYPadThumbMethods, Props>(
  function Thumb(
    {
      color,
      children,
      className,
      style,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-valuetext': ariaValuetext,
      ...props
    },
    forwardedRef,
  ) {
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
      percent,
      thumbRef,
    } = useXYPadContext()

    // The thumb is positioned against the area.
    useCheckPlacement('XYPad.Thumb', 'XYPad.Area')

    // Per axis, since the thumb holds one input for each.
    const labels = toXY(ariaLabel)
    const labelledby = toXY(ariaLabelledby)
    const describedby = toXY(ariaDescribedby)
    const valueText = toXY(ariaValuetext)

    const methods = () => ({
      focus() {
        if (!disabled) xInputRef.current?.focus()
      },
      blur() {
        xInputRef.current?.blur()
        yInputRef.current?.blur()
      },
    })

    useImperativeHandle(forwardedRef, methods, [disabled])
    // Root focuses the thumb when a drag starts, wherever the user placed it.
    useImperativeHandle(thumbRef, methods, [disabled])

    return (
      <div
        className={cx('tremolo-xy-pad-thumb', className)}
        data-disabled={disabled || undefined}
        data-readonly={readonly || undefined}
        {...props}
        style={{
          ...{ '--color': color },
          // Not a style but the mechanics of the position below: the thumb is
          // placed by a percentage of the area, which needs it out of flow and
          // measured from its own centre.
          position: 'absolute',
          translate: 'var(--translate, -50% -50%)',
          zIndex: 100,
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
            data-axis={axis === 0 ? 'x' : 'y'}
            value={value[axis]}
            min={min[axis]}
            max={max[axis]}
            step={step[axis]}
            disabled={disabled}
            aria-readonly={readonly}
            aria-orientation={axis === 0 ? 'horizontal' : 'vertical'}
            aria-label={labels[axis] ?? (axis === 0 ? 'x' : 'y')}
            aria-labelledby={labelledby[axis]}
            aria-describedby={describedby[axis]}
            aria-valuetext={valueText[axis]}
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
  },
)
