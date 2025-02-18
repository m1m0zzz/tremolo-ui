import { CSSProperties, ReactElement } from 'react'
import clsx from 'clsx'
import { styleHelper, xor } from '@tremolo-ui/functions'

export const defaultLength = 140
export const defaultThickness = 10

interface CustomCSS {
  '--active': string
  '--inactive': string
}

export interface SliderTrackProps {
  length?: number | string
  thickness?: number | string

  className?: string
  style?: CSSProperties & Partial<CustomCSS>
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

  return (
    <div
      className={clsx('tremolo-slider-track', className)}
      aria-disabled={__disabled}
      style={{
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
