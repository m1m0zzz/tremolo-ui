import { css, CSSObject } from '@emotion/react'
import { ReactElement } from 'react'
import clsx from 'clsx'

export interface AreaProps {
  width?: number | string
  height?: number | string
  bg?: string
  className?: string
  style?: CSSObject
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
      css={css({
        position: 'relative',
        width: width,
        height: height,
        background: bg,
        ...style
      })}
    >
      {children}
      {__thumb}
    </div>
  )
}
