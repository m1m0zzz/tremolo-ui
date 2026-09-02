import { ReactNode, SVGProps } from 'react'

import { viewBoxSize } from './context'

export interface SVGRootProps {
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
}: SVGRootProps & Omit<SVGProps<SVGSVGElement>, keyof SVGRootProps>) {
  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{
        display: 'block',
        ...style,
      }}
      {...props}
    >
      {children}
    </svg>
  )
}
