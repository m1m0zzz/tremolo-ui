import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactElement } from 'react'

/** @category XYPad */
export interface AreaProps {
  width?: number | string
  height?: number | string
  color?: string
  className?: string
  style?: CSSProperties
  children?: ReactElement

  /** inherit */
  __thumb?: ReactElement
}

/** @category XYPad */
export function XYPadArea({
  width = 120,
  height = 120,
  color,
  children,
  className,
  style,
  __thumb,
  ...props
}: AreaProps & Omit<ComponentPropsWithoutRef<'div'>, keyof AreaProps>) {
  return (
    <div
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
      {__thumb}
    </div>
  )
}
