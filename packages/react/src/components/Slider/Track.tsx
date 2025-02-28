import clsx from 'clsx'
import { CSSProperties, ReactElement } from 'react'

import { styleHelper, xor } from '@tremolo-ui/functions'

import { useDisabled, useReverse, useVertical } from './context'

/** @category Slider */
export const defaultLength = 140
/** @category Slider */
export const defaultThickness = 10

/** @category Slider */
export interface SliderTrackProps {
  length?: number | string
  thickness?: number | string

  active?: string
  inactive?: string

  className?: string
  style?: CSSProperties
  children?: ReactElement

  /** @internal */
  __thumb?: ReactElement
  /** @internal */
  __percent?: number
}

/** @category Slider */
export function SliderTrack({
  length = defaultLength,
  thickness = defaultThickness,
  active,
  inactive,
  children,
  className,
  style,
  __thumb,
  __percent,
}: SliderTrackProps) {
  const vertical = useVertical()
  const reverse = useReverse()
  const disabled = useDisabled()

  const direction = vertical ? 'bottom' : 'right'
  const colors = {
    '--active': active,
    '--inactive': inactive,
  }

  return (
    <div
      className={clsx('tremolo-slider-track', className)}
      aria-disabled={disabled}
      data-vertical={vertical}
      style={{
        ...colors,
        background: xor(vertical, reverse)
          ? `linear-gradient(to ${direction}, var(--inactive, #eee) ${__percent}%, var(--active, #7998ec) ${__percent}%)`
          : `linear-gradient(to ${direction}, var(--active, #7998ec) ${__percent}%, var(--inactive, #eee) ${__percent}%)`,
        borderRadius: styleHelper(thickness!, '/', 2),
        width: !vertical ? length : thickness,
        height: vertical ? length : thickness,
        ...style,
      }}
    >
      {children}
      {__thumb}
    </div>
  )
}
