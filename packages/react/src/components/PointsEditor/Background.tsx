import { ComponentPropsWithoutRef } from 'react'

import { type WithCSSVariables } from '../../css-variables'

export function Background({
  className,
  children,
  style,
  ...props
}: WithCSSVariables<ComponentPropsWithoutRef<'div'>>) {
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
