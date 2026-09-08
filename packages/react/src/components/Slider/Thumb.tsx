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
  ref?: Ref<SliderThumbMethods>
}

export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

type Props = SliderThumbProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderThumbProps>

export function Thumb({
  color,
  children,
  className,
  style,
  ref,
  ...props
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const { vertical, disabled, readonly, percent, thumbRef } = useSliderContext()

  // The thumb is positioned against the track.
  useCheckPlacement('Slider.Thumb', 'Slider.Track')

  const methods = () => ({
    focus() {
      elementRef.current?.focus()
    },
    blur() {
      elementRef.current?.blur()
    },
  })

  useImperativeHandle(ref, methods, [])
  // Root focuses the thumb when a drag starts, wherever the user placed it.
  useImperativeHandle(thumbRef, methods, [])

  return (
    <div
      ref={elementRef}
      className={cx('tremolo-slider-thumb', className)}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-disabled={disabled}
      aria-readonly={readonly}
      {...props}
      style={{
        ...{ '--color': color },
        ...style,
        // Where the thumb sits is the component's decision, not a style: a
        // `left` from the caller would take it off the track, so it is
        // written after theirs.
        top: vertical ? `${percent}%` : '50%',
        left: !vertical ? `${percent}%` : '50%',
      }}
    >
      {children}
    </div>
  )
}
