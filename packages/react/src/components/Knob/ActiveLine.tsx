import clsx from 'clsx'
import { SVGProps } from 'react'

import { useCheckPlacement } from '../_util/placement'

import { arcRadius, pointOnArc, useKnobContext } from './context'

export function ActiveLine({
  stroke = 'currentColor',
  strokeWidth = 6,
  className,
  ...props
}: Omit<SVGProps<SVGPathElement>, 'd'>) {
  useCheckPlacement('Knob.ActiveLine', 'Knob.SVGRoot')

  const r2 = useKnobContext((s) => s.r2)
  const r3 = useKnobContext((s) => s.r3)

  const radius = arcRadius(strokeWidth)
  const start = pointOnArc(r2, radius)
  const end = pointOnArc(r3, radius)

  return (
    <path
      className={clsx('tremolo-knob-active-line', className)}
      d={`M ${start.x} ${start.y} A ${radius} ${radius} -135 ${r3 - r2 > 180 ? 1 : 0} 1 ${end.x} ${end.y}`}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}
