import clsx from 'clsx'
import { SVGProps } from 'react'

import { center, useKnobContext } from './context'

/** @category Knob */
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
  const x1 = useKnobContext((s) => s.x1)
  const y1 = useKnobContext((s) => s.y1)
  const x2 = useKnobContext((s) => s.x2)
  const y2 = useKnobContext((s) => s.y2)
  const x3 = useKnobContext((s) => s.x3)
  const y3 = useKnobContext((s) => s.y3)
  const x4 = useKnobContext((s) => s.x4)
  const y4 = useKnobContext((s) => s.y4)

  return (
    <>
      {startValue > min && (
        <path
          className={clsx('tremolo-knob-inactive-line', className)}
          d={`M ${x1} ${y1} A ${center} ${center} -135 ${r2 - r1 > 180 ? 1 : 0} 1 ${x2} ${y2}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...props}
        />
      )}
      {startValue < max && (
        <path
          className={clsx('tremolo-knob-inactive-line', className)}
          d={`M ${x3} ${y3} A ${center} ${center} -135 ${r4 - r3 > 180 ? 1 : 0} 1 ${x4} ${y4}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...props}
        />
      )}
    </>
  )
}
