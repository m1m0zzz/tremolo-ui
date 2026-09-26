import { SVGProps } from 'react'

import { knobArcPath, knobArcRadius } from '@tremolo-ui/dom'

import { useCheckPlacement } from '../_util/Placement'

import { useKnobContext } from './context'

export function ActiveLine({
  stroke = 'currentColor',
  strokeWidth = 6,
  className,
  ...props
}: Omit<SVGProps<SVGPathElement>, 'd'>) {
  useCheckPlacement('Knob.ActiveLine', 'Knob.SVGRoot')

  const r2 = useKnobContext((s) => s.r2)
  const r3 = useKnobContext((s) => s.r3)

  const radius = knobArcRadius(strokeWidth)

  return (
    <path
      className={className}
      d={knobArcPath(r2, r3, radius)}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}
