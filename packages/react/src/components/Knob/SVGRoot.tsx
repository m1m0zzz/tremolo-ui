import { ReactNode, SVGProps } from 'react'

import { KNOB_VIEWBOX_SIZE } from '@tremolo-ui/dom'

import { Placement } from '../_util/Placement'

export interface KnobSVGRootProps {
  /**
   * `<Knob.InactiveLine />`, `<Knob.ActiveLine />` and `<Knob.Thumb />` go
   * here, in the order you want them painted.
   */
  children: ReactNode
}

export function SVGRoot({
  children,
  style,
  ...props
}: KnobSVGRootProps & Omit<SVGProps<SVGSVGElement>, keyof KnobSVGRootProps>) {
  return (
    <svg
      viewBox={`0 0 ${KNOB_VIEWBOX_SIZE} ${KNOB_VIEWBOX_SIZE}`}
      style={{
        display: 'block',
        ...style,
      }}
      {...props}
    >
      <Placement name="Knob.SVGRoot">{children}</Placement>
    </svg>
  )
}
