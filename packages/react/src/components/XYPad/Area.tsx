import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactElement } from 'react'

/** @category XYPad */
export interface AreaProps {
  width?: number | string
  height?: number | string
  bg?: string
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
  bg = '#eee',
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
        position: 'relative',
        width: width,
        height: height,
        background: bg,
        ...style,
      }}
      {...props}
    >
      {children}
      {__thumb}
    </div>
  )
}
