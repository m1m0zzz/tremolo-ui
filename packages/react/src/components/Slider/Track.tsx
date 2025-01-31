import { css, CSSObject } from '@emotion/react'
import { ReactElement } from 'react'
import clsx from 'clsx'
import { styleHelper } from '@tremolo-ui/functions'
import { isHorizontal } from '@tremolo-ui/functions/Slider'

import { Direction, gradientDirection } from './type'

export interface SliderTrackProps {
  length?: number | string
  thickness?: number | string

  activeBg?: string
  inactiveBg?: string
  activeHoverBg?: string
  inactiveHoverBg?: string

  disabledActiveBg?: string
  disabledInactiveBg?: string
  disabledActiveHoverBg?: string
  disabledInactiveHoverBg?: string

  className?: string
  style?: CSSObject
  children?: ReactElement

  /** inherit */
  __thumb?: ReactElement
  /** inherit */
  __direction?: Direction
  /** inherit */
  __disabled?: boolean
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
  disabledActiveBg = '#858890',
  disabledInactiveBg = '#ddd',
  disabledActiveHoverBg = disabledActiveBg,
  disabledInactiveHoverBg = disabledInactiveBg,
  children,
  className,
  style,
  __thumb,
  __direction,
  __disabled,
  __percent,
}: SliderTrackProps) {
  const active = __disabled ? disabledActiveBg : activeBg
  const inactive = __disabled ? disabledInactiveBg : inactiveBg
  const activeHover = __disabled ? disabledActiveHoverBg : activeHoverBg
  const inactiveHover = __disabled ? disabledInactiveHoverBg : inactiveHoverBg
  return (
    <div
      className={clsx('tremolo-slider-track', className)}
      css={css({
        position: 'relative',
        background: `linear-gradient(to ${gradientDirection(__direction!)}, ${active} ${__percent}%, ${inactive} ${__percent}%)`,
        borderRadius: styleHelper(thickness!, '/', 2),
        width: isHorizontal(__direction!) ? length : thickness,
        height: isHorizontal(__direction!) ? thickness : length,
        ':hover': {
          background: `linear-gradient(to ${gradientDirection(__direction!)}, ${activeHover} ${__percent}%, ${inactiveHover} ${__percent}%)`
        },
        ...style
      })}
    >
      {children}
      {__thumb}
    </div>
  )
}
