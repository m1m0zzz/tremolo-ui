import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from 'react'

import { useComposedRefs } from '../_util/composeRefs'
import { Placement } from '../_util/placement'

import { useXYPadContext } from './context'

export interface XYPadAreaProps {
  width?: number | string
  height?: number | string
  color?: string
  className?: string
  style?: CSSProperties
  /** `<XYPad.Thumb />` goes here. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

export function Area({
  width = 120,
  height = 120,
  color,
  children,
  className,
  style,
  ref,
  ...props
}: XYPadAreaProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadAreaProps>) {
  const { areaRef } = useXYPadContext()

  // The area is what the pointer position is normalized against, so the
  // context ref is composed with any ref the caller passed.
  const composedRef = useComposedRefs<HTMLDivElement>(ref, areaRef)

  return (
    <div
      ref={composedRef}
      className={clsx('tremolo-xy-pad-area', className)}
      style={{
        ...{ '--color': color },
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    >
      <Placement name="XYPad.Area">{children}</Placement>
    </div>
  )
}
