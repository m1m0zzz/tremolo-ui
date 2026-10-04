import { ComponentPropsWithoutRef, CSSProperties, forwardRef } from 'react'

import { cssLength } from '@tremolo-ui/dom/internal'

import { useComposedRefs } from '../../compose-refs'
import { Placement } from '../_util/Placement'

import { useSliderContext } from './context'

import type { CSSVariables } from '../../css-variables'

export interface SliderTrackProps {
  /**
   * How long the track is along the axis the slider runs. Sets `--length`;
   * the size the theme gives it stands when this is omitted.
   */
  length?: number | string
  /** How thick the track is across that axis. Sets `--thickness`. */
  thickness?: number | string

  /** Colour of the part from `min` to the value. Sets `--active-color`. */
  activeColor?: string
  /** Colour of the rest of the track. Sets `--inactive-color`. */
  inactiveColor?: string

  style?: CSSProperties &
    CSSVariables<
      'length' | 'thickness' | 'active-color' | 'inactive-color' | 'percent'
    >
}

type Props = SliderTrackProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderTrackProps>

export const Track = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  function Track(
    {
      length,
      thickness,
      activeColor,
      inactiveColor,
      children,
      className,
      style,
      ...props
    },
    forwardedRef,
  ) {
    const { orientation, reverse, disabled, percent, trackRef } =
      useSliderContext()

    // The track is what the pointer position is normalized against, so the
    // context ref is composed with any ref the caller passed.
    const composedRef = useComposedRefs<HTMLDivElement>(forwardedRef, trackRef)

    return (
      <div
        ref={composedRef}
        className={className}
        data-disabled={disabled ? '' : undefined}
        data-orientation={orientation}
        // Which end the value grows from. `percent` is already the position on
        // screen, so this only says which side of it is the filled one.
        data-flipped={(orientation === 'vertical') !== reverse ? '' : undefined}
        style={
          {
            '--active-color': activeColor,
            '--inactive-color': inactiveColor,
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
