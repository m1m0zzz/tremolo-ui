import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
} from 'react'

import { xor } from '@tremolo-ui/functions'

import { useComposedRefs } from '../../compose-refs'
import { cssLength } from '../_util/css-length'
import { cx } from '../_util/cx'
import { Placement } from '../_util/Placement'

import { useSliderContext } from './context'

export interface SliderTrackProps {
  /**
   * How long the track is along the axis the slider runs. Sets `--length`;
   * the size the theme gives it stands when this is omitted.
   */
  length?: number | string
  /** How thick the track is across that axis. Sets `--thickness`. */
  thickness?: number | string

  /** Colour of the part below the value. Sets `--active`. */
  active?: string
  /** Colour of the part above it. Sets `--inactive`. */
  inactive?: string

  className?: string
  style?: CSSProperties
  /** `<Slider.Thumb />` goes here. */
  children?: ReactNode
}

type Props = SliderTrackProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderTrackProps>

export const Track = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  function Track(
    {
      length,
      thickness,
      active,
      inactive,
      children,
      className,
      style,
      ...props
    },
    forwardedRef,
  ) {
    const { vertical, reverse, disabled, percent, trackRef } =
      useSliderContext()

    // The track is what the pointer position is normalized against, so the
    // context ref is composed with any ref the caller passed.
    const composedRef = useComposedRefs<HTMLDivElement>(forwardedRef, trackRef)

    return (
      <div
        ref={composedRef}
        className={cx('tremolo-slider-track', className)}
        data-disabled={disabled || undefined}
        data-orientation={vertical ? 'vertical' : 'horizontal'}
        // Which end the value grows from. `percent` is already the position on
        // screen, so this only says which side of it is the filled one.
        data-flipped={xor(vertical, reverse) || undefined}
        style={
          {
            '--active': active,
            '--inactive': inactive,
            '--length': cssLength(length),
            '--thickness': cssLength(thickness),
            // Where the value sits, for the theme to paint the fill with. The
            // component draws nothing itself: this is the one number CSS cannot
            // work out on its own.
            '--percent': `${percent}%`,
            // The thumb inside is placed against this box.
            position: 'relative',
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        <Placement name="Slider.Track">{children}</Placement>
      </div>
    )
  },
)
