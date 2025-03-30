import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactElement } from 'react'

import { styleHelper, xor } from '@tremolo-ui/functions'

import { useSliderContext } from './context'

export const defaultLength = 140
export const defaultThickness = 10

/** @category Slider */
export interface SliderTrackProps {
  length?: number | string
  thickness?: number | string

  active?: string
  inactive?: string

  defaultStyle?: boolean

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
  defaultStyle = true,
  __thumb,
  __percent = 0,
  ...props
}: SliderTrackProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderTrackProps>) {
  const vertical = useSliderContext((s) => s.vertical)
  const reverse = useSliderContext((s) => s.reverse)
  const disabled = useSliderContext((s) => s.disabled)

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
      style={
        !defaultStyle
          ? style
          : {
              ...colors,
              background: xor(vertical, reverse)
                ? `linear-gradient(to ${direction}, var(--inactive, #eee) ${__percent}%, var(--active, #7998ec) ${__percent}%)`
                : `linear-gradient(to ${direction}, var(--active, #7998ec) ${__percent}%, var(--inactive, #eee) ${__percent}%)`,
              borderRadius: styleHelper(thickness!, '/', 2),
              width: !vertical ? length : thickness,
              height: vertical ? length : thickness,
              ...style,
            }
      }
      {...props}
    >
      {children}
      {__thumb}
    </div>
  )
}
