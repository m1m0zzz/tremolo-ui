import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

import { xor } from '@tremolo-ui/functions'
import { generateOptionsList, ScaleOptions } from '@tremolo-ui/functions/Slider'

import { useMax, useMin, useReverse, useStep, useVertical } from './context'
import { ScaleOption } from './ScaleOption'

export interface ScaleProps {
  gap?: number | string
  options?: ScaleOptions
  children?: ReactNode
}

type Props = ScaleProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof ScaleProps>

export function Scale({
  gap = 6,
  options,
  children,
  className,
  style,
  ...props
}: Props) {
  const min = useMin()
  const max = useMax()
  const step = useStep()
  const vertical = useVertical()
  const reverse = useReverse()

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
