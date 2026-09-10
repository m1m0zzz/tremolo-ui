import { SVGProps } from 'react'

import { cx } from '../_util/cx'
import { useCheckPlacement } from '../_util/placement'

import { arcPath, arcRadius, useKnobContext } from './context'

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

  return (
    <path
      className={cx('tremolo-knob-active-line', className)}
      d={arcPath(r2, r3, radius)}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}
