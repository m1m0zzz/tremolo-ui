import { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cx } from '../_util/cx'

export interface PointsEditorBackgroundProps {
  /** Whatever the points are placed over: a graph, a canvas, an image. */
  children?: ReactNode
}

export function Background({
  className,
  children,
  ...props
}: PointsEditorBackgroundProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorBackgroundProps>) {
  return (
    <div
      className={cx('tremolo-points-editor-background', className)}
      {...props}
    >
      {children}
    </div>
  )
}
