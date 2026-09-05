import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

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
      className={clsx('tremolo-points-editor-background', className)}
      {...props}
    >
      {children}
    </div>
  )
}
