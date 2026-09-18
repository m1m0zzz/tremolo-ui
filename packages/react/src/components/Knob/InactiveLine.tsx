import { SVGProps } from 'react'

import { useCheckPlacement } from '../_util/Placement'

import { arcPath, arcRadius, useKnobContext } from './context'

export function InactiveLine({
  stroke = 'currentColor',
  strokeWidth = 6,
  className,
  ...props
}: Omit<SVGProps<SVGPathElement>, 'd'>) {
  useCheckPlacement('Knob.InactiveLine', 'Knob.SVGRoot')

  const min = useKnobContext((s) => s.min)
  const max = useKnobContext((s) => s.max)
  const startValue = useKnobContext((s) => s.startValue)

  const r1 = useKnobContext((s) => s.r1)
  const r2 = useKnobContext((s) => s.r2)
  const r3 = useKnobContext((s) => s.r3)
  const r4 = useKnobContext((s) => s.r4)

  const radius = arcRadius(strokeWidth)

  return (
    <>
      {startValue > min && (
        <path
          className={className}
          d={arcPath(r1, r2, radius)}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...props}
        />
      )}
      {startValue < max && (
        <path
          className={className}
          d={arcPath(r3, r4, radius)}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...props}
        />
      )}
    </>
  )
}
