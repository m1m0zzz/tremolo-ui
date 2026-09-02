import clsx from 'clsx'
import { SVGProps } from 'react'

import { arcRadius, pointOnArc, useKnobContext } from './context'

export function InactiveLine({
  stroke = 'currentColor',
  strokeWidth = 6,
  className,
  ...props
}: Omit<SVGProps<SVGPathElement>, 'd'>) {
  const min = useKnobContext((s) => s.min)
  const max = useKnobContext((s) => s.max)
  const startValue = useKnobContext((s) => s.startValue)

  const r1 = useKnobContext((s) => s.r1)
  const r2 = useKnobContext((s) => s.r2)
  const r3 = useKnobContext((s) => s.r3)
  const r4 = useKnobContext((s) => s.r4)

  const radius = arcRadius(strokeWidth)
  const p1 = pointOnArc(r1, radius)
  const p2 = pointOnArc(r2, radius)
  const p3 = pointOnArc(r3, radius)
  const p4 = pointOnArc(r4, radius)

  return (
    <>
      {startValue > min && (
        <path
          className={clsx('tremolo-knob-inactive-line', className)}
          d={`M ${p1.x} ${p1.y} A ${radius} ${radius} -135 ${r2 - r1 > 180 ? 1 : 0} 1 ${p2.x} ${p2.y}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...props}
        />
      )}
      {startValue < max && (
        <path
          className={clsx('tremolo-knob-inactive-line', className)}
          d={`M ${p3.x} ${p3.y} A ${radius} ${radius} -135 ${r4 - r3 > 180 ? 1 : 0} 1 ${p4.x} ${p4.y}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...props}
        />
      )}
    </>
  )
}
