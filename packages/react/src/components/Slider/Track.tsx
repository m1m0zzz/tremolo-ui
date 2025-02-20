import clsx from 'clsx'
import { CSSProperties, ReactElement } from 'react'

import { styleHelper, xor } from '@tremolo-ui/functions'

export const defaultLength = 140
export const defaultThickness = 10

export interface SliderTrackProps {
  length?: number | string
  thickness?: number | string

  active?: string
  inactive?: string

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
  active,
  inactive,
  children,
  className,
  style,
  __thumb,
  __vertical,
  __reverse,
  __disabled,
  __percent,
}: SliderTrackProps) {
  const direction = __vertical ? 'bottom' : 'right'
  const colors = {
    '--active': active,
    '--inactive': inactive,
  }

  return (
    <div
      className={clsx('tremolo-slider-track', className)}
      aria-disabled={__disabled}
      style={{
        ...colors,
        background: xor(__vertical, __reverse)
          ? `linear-gradient(to ${direction}, var(--inactive, #eee) ${__percent}%, var(--active, #7998ec) ${__percent}%)`
          : `linear-gradient(to ${direction}, var(--active, #7998ec) ${__percent}%, var(--inactive, #eee) ${__percent}%)`,
        borderRadius: styleHelper(thickness!, '/', 2),
        width: !__vertical ? length : thickness,
        height: __vertical ? length : thickness,
        ...style,
      }}
    >
      {children}
      {__thumb}
    </div>
  )
}
