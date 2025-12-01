import { SVGProps } from 'react'

import { Override } from '../_util/type'

import { ActiveLine } from './ActiveLine'
import { viewBoxSize } from './context'
import { InactiveLine } from './InactiveLine'
import { Thumb } from './Thumb'

interface SVGRoot {
  block?: boolean
  overflowVisible?: boolean
}

/** @category Knob */
export function SVGRoot({
  children,
  style,
  ...props
}: Override<SVGRoot, SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{
        display: 'block',
        overflow: 'visible',
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
