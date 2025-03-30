import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

import { xor } from '@tremolo-ui/functions'
import { generateOptionsList, ScaleOptions } from '@tremolo-ui/functions/Slider'

import { useSliderContext } from './context'
import { ScaleOption } from './ScaleOption'

/** @category Slider */
export interface ScaleProps {
  gap?: number | string
  options?: ScaleOptions
  children?: ReactNode
}

/** @category Slider */
export function Scale({
  gap = 6,
  options,
  children,
  className,
  style,
  ...props
}: ScaleProps & Omit<ComponentPropsWithoutRef<'div'>, keyof ScaleProps>) {
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
      className={clsx('tremolo-slider-scale', className)}
      style={{
        marginLeft: vertical ? gap : undefined,
        marginTop: !vertical ? gap : undefined,
        ...style,
      }}
      {...props}
    >
      {options
        ? optionsList.map(({ value, type }, index) => {
            return <ScaleOption key={index} value={value} type={type} />
          })
        : children}
    </div>
  )
}
