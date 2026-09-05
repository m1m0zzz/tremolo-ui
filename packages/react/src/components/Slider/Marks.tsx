import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

import { xor } from '@tremolo-ui/functions'

import { Placement } from '../_util/placement'

import { useSliderContext } from './context'
import { MarksOption } from './MarksOption'
import { generateOptionsList, MarksOptions } from './type'

export interface MarksProps {
  gap?: number | string
  options?: MarksOptions
  children?: ReactNode
}

export function Marks({
  gap = 6,
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
      className={clsx('tremolo-slider-marks', className)}
      style={{
        marginLeft: vertical ? gap : undefined,
        marginTop: !vertical ? gap : undefined,
        ...style,
      }}
      {...props}
    >
      <Placement name="Slider.Marks">
        {options
          ? optionsList.map(({ value, type }, index) => {
              return <MarksOption key={index} value={value} type={type} />
            })
          : children}
      </Placement>
    </div>
  )
}
