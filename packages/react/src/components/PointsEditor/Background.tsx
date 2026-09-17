import { ComponentPropsWithoutRef, CSSProperties } from 'react'

import type { CSSVariables } from '../../css-variables'

export function Background({
  className,
  children,
  style,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'style'> & {
  style?: CSSProperties & CSSVariables
}) {
  return (
    <div
      className={className}
      style={{
        // Behind the points, filling the editor: what it is for, rather than
        // a look. The order of the layers holds whichever way they are
        // written, so the z-index is part of the same mechanics.
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
