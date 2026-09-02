import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

import { useXYPadContext } from './context'

export interface XYPadAreaProps {
  width?: number | string
  height?: number | string
  color?: string
  className?: string
  style?: CSSProperties
  /** `<XYPad.Thumb />` goes here. */
  children?: ReactNode
}

export function Area({
  width = 120,
  height = 120,
  color,
  children,
  className,
  style,
  ...props
}: XYPadAreaProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadAreaProps>) {
  const { areaRef } = useXYPadContext()

  return (
    <div
      // The area is what the pointer position is normalized against.
      ref={areaRef}
      className={clsx('tremolo-xy-pad-area', className)}
      style={{
        ...{ '--color': color },
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
