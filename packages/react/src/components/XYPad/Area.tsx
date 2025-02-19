import clsx from 'clsx'
import { CSSProperties, ReactElement } from 'react'

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

export function XYPadArea({
  width = 120,
  height = 120,
  bg = '#eee',
  children,
  className,
  style,
  __thumb,
}: AreaProps) {
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
    >
      {children}
      {__thumb}
    </div>
  )
}
