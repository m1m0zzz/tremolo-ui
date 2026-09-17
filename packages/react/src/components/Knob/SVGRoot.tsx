import { ReactNode, SVGProps, CSSProperties } from 'react'

import { Placement } from '../_util/Placement'

import { viewBoxSize } from './context'

import type { CSSVariables } from '../../css-variables'

export interface KnobSVGRootProps {
  /**
   * `<Knob.InactiveLine />`, `<Knob.ActiveLine />` and `<Knob.Thumb />` go
   * here, in the order you want them painted.
   */
  children: ReactNode

  style?: CSSProperties & CSSVariables
}

export function SVGRoot({
  children,
  style,
  ...props
}: KnobSVGRootProps & Omit<SVGProps<SVGSVGElement>, keyof KnobSVGRootProps>) {
  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
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
