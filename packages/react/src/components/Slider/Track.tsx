import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from 'react'

import { styleHelper, xor } from '@tremolo-ui/functions'

import { useComposedRefs } from '../_util/composeRefs'
import { Placement } from '../_util/placement'

import { useSliderContext } from './context'

export const defaultLength = 140
export const defaultThickness = 10

export interface SliderTrackProps {
  length?: number | string
  thickness?: number | string

  active?: string
  inactive?: string

  defaultStyle?: boolean

  className?: string
  style?: CSSProperties
  /** `<Slider.Thumb />` goes here. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

export function Track({
  length = defaultLength,
  thickness = defaultThickness,
  active,
  inactive,
  children,
  className,
  style,
  defaultStyle = true,
  ref,
  ...props
}: SliderTrackProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderTrackProps>) {
  const { vertical, reverse, disabled, percent, trackRef } = useSliderContext()

  // The track is what the pointer position is normalized against, so the
  // context ref is composed with any ref the caller passed.
  const composedRef = useComposedRefs<HTMLDivElement>(ref, trackRef)

  const direction = vertical ? 'bottom' : 'right'
  const colors = {
    '--active': active,
    '--inactive': inactive,
  }

  return (
    <div
      ref={composedRef}
      className={clsx('tremolo-slider-track', className)}
      aria-disabled={disabled}
      data-vertical={vertical}
      style={
        !defaultStyle
          ? style
          : {
              ...colors,
              background: xor(vertical, reverse)
                ? `linear-gradient(to ${direction}, var(--inactive) ${percent}%, var(--active) ${percent}%)`
                : `linear-gradient(to ${direction}, var(--active) ${percent}%, var(--inactive) ${percent}%)`,
              borderRadius: styleHelper(thickness!, '/', 2),
              width: !vertical ? length : thickness,
              height: vertical ? length : thickness,
              ...style,
            }
      }
      {...props}
    >
      <Placement name="Slider.Track">{children}</Placement>
    </div>
  )
}
