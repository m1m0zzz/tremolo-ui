import { css, CSSObject } from '@emotion/react'
import { ReactElement } from 'react'
import { styleHelper } from '@tremolo-ui/functions'
import { isHorizontal } from '@tremolo-ui/functions/Slider'

import { Direction, gradientDirection } from './type'

interface SliderTrackProps {
  length?: number | string
  thickness?: number | string

  activeBg?: string
  inactiveBg?: string
  activeHoverBg?: string
  inactiveHoverBg?: string

  style?: CSSObject
  children?: ReactElement

  /** inherit */
  __direction?: Direction
  /** internal */
  __percent?: number
}

export function SliderTrack({
  length = 140,
  thickness = 10,
  activeBg = '#7998ec',
  inactiveBg = '#eee',
  activeHoverBg = '#6387e9',
  inactiveHoverBg = '#e0e0e0',
  __direction,
  children,
  style,
  __percent,
}: SliderTrackProps) {
  return (
    <div
      className="tremolo-slider-track"
      css={css({
        background: `linear-gradient(to ${gradientDirection(__direction!)}, ${activeBg} ${__percent}%, ${inactiveBg} ${__percent}%)`,
        borderRadius: styleHelper(thickness!, '/', 2),
        width: isHorizontal(__direction!) ? length : thickness,
        height: isHorizontal(__direction!) ? thickness : length,
        ':hover': {
          background: `linear-gradient(to ${gradientDirection(__direction!)}, ${activeHoverBg} ${__percent}%, ${inactiveHoverBg} ${__percent}%)`
        },
        ...style
      })}
    >
      {children}
    </div>
  )
}
