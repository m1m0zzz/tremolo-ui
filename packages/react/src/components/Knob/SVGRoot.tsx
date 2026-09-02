import { SVGProps } from 'react'

import { ActiveLine } from './ActiveLine'
import { viewBoxSize } from './context'
import { InactiveLine } from './InactiveLine'
import { Thumb } from './Thumb'

export function SVGRoot({
  children,
  style,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{
        display: 'block',
        ...style,
      }}
      {...props}
    >
      {children || (
        <>
          <InactiveLine />
          <ActiveLine />
          <Thumb />
        </>
      )}
    </svg>
  )
}
