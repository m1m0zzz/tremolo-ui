import { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cx } from '../_util/cx'

export interface PointsEditorBackgroundProps {
  /** Whatever the points are placed over: a graph, a canvas, an image. */
  children?: ReactNode
}

export function Background({
  className,
  children,
  style,
  ...props
}: PointsEditorBackgroundProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorBackgroundProps>) {
  return (
    <div
      className={cx('tremolo-points-editor-background', className)}
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
