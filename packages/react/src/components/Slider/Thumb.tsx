import {
  AriaAttributes,
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react'

import { useCheckPlacement } from '../_util/Placement'
import { VisuallyHiddenRangeInput } from '../_util/VisuallyHiddenRangeInput'

import { useSliderContext } from './context'

export interface SliderThumbProps {
  /**
   * Size comes from the `--thumb-size` CSS variable on `Slider.Root`, so that
   * the root can reserve the matching amount of space around the track.
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
  'aria-label'?: AriaAttributes['aria-label']
  'aria-labelledby'?: AriaAttributes['aria-labelledby']
  'aria-describedby'?: AriaAttributes['aria-describedby']
  'aria-valuetext'?: AriaAttributes['aria-valuetext']
}

export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

type Props = SliderThumbProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderThumbProps>

export const Thumb = /* @__PURE__ */ forwardRef<SliderThumbMethods, Props>(
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
    const inputRef = useRef<HTMLInputElement>(null)
    const {
      value,
      min,
      max,
      step,
      vertical,
      disabled,
      readonly,
      onChange,
      percent,
      thumbRef,
    } = useSliderContext()

    // The thumb is positioned against the track.
    useCheckPlacement('Slider.Thumb', 'Slider.Track')

    const methods = () => ({
      focus() {
        if (!disabled) inputRef.current?.focus()
      },
      blur() {
        inputRef.current?.blur()
      },
    })

    useImperativeHandle(forwardedRef, methods, [disabled])
    // Root focuses the thumb when a drag starts, wherever the user placed it.
    useImperativeHandle(thumbRef, methods, [disabled])

    return (
      <div
        className={className}
        data-disabled={disabled || undefined}
        data-readonly={readonly || undefined}
        {...props}
        style={{
          ...{ '--color': color },
          // Not a style but the mechanics of the position below: the thumb is
          // placed by a percentage of the track, which needs it out of flow
          // and measured from its own centre. `--translate` is there for a
          // thumb that should hang off its edge instead.
          position: 'absolute',
          translate: 'var(--translate, -50% -50%)',
          zIndex: 100,
          ...style,
          // Where the thumb sits is the component's decision, not a style: a
          // `left` from the caller would take it off the track, so it is
          // written after theirs.
          top: vertical ? `${percent}%` : '50%',
          left: !vertical ? `${percent}%` : '50%',
        }}
      >
        <VisuallyHiddenRangeInput
          ref={inputRef}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-readonly={readonly}
          aria-orientation={vertical ? 'vertical' : 'horizontal'}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-describedby={ariaDescribedby}
          aria-valuetext={ariaValuetext}
          onChange={(event) => {
            if (readonly) {
              event.currentTarget.value = String(value)
              return
            }
            onChange?.(event.currentTarget.valueAsNumber)
          }}
        />
        {children}
      </div>
    )
  },
)
