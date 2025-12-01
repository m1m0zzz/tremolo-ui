import clsx from 'clsx'
import { SVGProps } from 'react'

import { center, useKnobContext } from './context'

/** @category Knob */
export function ActiveLine({
  stroke = 'currentColor',
  strokeWidth = 6,
  className,
  ...props
}: Omit<SVGProps<SVGPathElement>, 'd'>) {
  const r2 = useKnobContext((s) => s.r2)
  const r3 = useKnobContext((s) => s.r3)
  const x2 = useKnobContext((s) => s.x2)
  const y2 = useKnobContext((s) => s.y2)
  const x3 = useKnobContext((s) => s.x3)
  const y3 = useKnobContext((s) => s.y3)

  return (
    <path
      className={clsx('tremolo-knob-active-line', className)}
      d={`M ${x2} ${y2} A ${center} ${center} -135 ${r3 - r2 > 180 ? 1 : 0} 1 ${x3} ${y3}`}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}
