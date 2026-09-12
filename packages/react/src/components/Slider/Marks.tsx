import { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

import { xor } from '@tremolo-ui/functions'

import { cssLength } from '../_util/css-length'
import { cx } from '../_util/cx'
import { Placement } from '../_util/Placement'

import { useSliderContext } from './context'
import { MarksOption } from './MarksOption'
import { generateOptionsList, MarksOptions } from './type'

export interface MarksProps {
  /**
   * Space between the marks and the track. Sets `--gap`; the theme's own
   * spacing stands when this is omitted.
   */
  gap?: number | string
  options?: MarksOptions
  children?: ReactNode
}

export function Marks({
  gap,
  options,
  children,
  className,
  style,
  ...props
}: MarksProps & Omit<ComponentPropsWithoutRef<'div'>, keyof MarksProps>) {
  const min = useSliderContext((s) => s.min)
  const max = useSliderContext((s) => s.max)
  const step = useSliderContext((s) => s.step)
  const vertical = useSliderContext((s) => s.vertical)
  const reverse = useSliderContext((s) => s.reverse)

  const optionsList = options
    ? generateOptionsList(options, min, max, step)
    : []
  if (xor(vertical, reverse)) optionsList.reverse()

  return (
    <div
      className={cx('tremolo-slider-marks', className)}
      data-vertical={vertical}
      style={
        {
          '--gap': cssLength(gap),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <Placement name="Slider.Marks">
        {options
          ? optionsList.map(({ value, mark, label }, index) => {
              return (
                <MarksOption
                  key={index}
                  value={value}
                  mark={mark}
                  label={label ? undefined : null}
                />
              )
            })
          : children}
      </Placement>
    </div>
  )
}
