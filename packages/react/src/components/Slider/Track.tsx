import { CSSProperties, ReactElement } from 'react'
import clsx from 'clsx'
import { styleHelper, xor } from '@tremolo-ui/functions'

export const defaultLength = 140
export const defaultThickness = 10

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
  style?: CSSProperties
  children?: ReactElement

  /** inherit */
  __thumb?: ReactElement
  /** inherit */
  __vertical?: boolean
  /** inherit */
  __reverse?: boolean
  /** inherit */
  __disabled?: boolean
  /** internal */
  __percent?: number
}

export function SliderTrack({
  length = defaultLength,
  thickness = defaultThickness,
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
  __vertical,
  __reverse,
  __disabled,
  __percent,
}: SliderTrackProps) {
  const active = __disabled ? disabledActiveBg : activeBg
  const inactive = __disabled ? disabledInactiveBg : inactiveBg
  const activeHover = __disabled ? disabledActiveHoverBg : activeHoverBg
  const inactiveHover = __disabled ? disabledInactiveHoverBg : inactiveHoverBg

  const direction = __vertical ? 'bottom' : 'right'

  return (
    <div
      className={clsx('tremolo-slider-track', className)}
      style={{
        position: 'relative',
        background:
          xor(__vertical, __reverse) ?
          `linear-gradient(to ${direction}, ${inactive} ${__percent}%, ${active} ${__percent}%)` :
          `linear-gradient(to ${direction}, ${active} ${__percent}%, ${inactive} ${__percent}%)`,
        borderRadius: styleHelper(thickness!, '/', 2),
        width: !__vertical ? length : thickness,
        height: __vertical ? length : thickness,
        // ':hover': {
        //   background:
        //     xor(__vertical, __reverse) ?
        //     `linear-gradient(to ${direction}, ${inactiveHover} ${__percent}%, ${activeHover} ${__percent}%)` :
        //     `linear-gradient(to ${direction}, ${activeHover} ${__percent}%, ${inactiveHover} ${__percent}%)`,
        // },
        ...style
      }}
    >
      {children}
      {__thumb}
    </div>
  )
}
