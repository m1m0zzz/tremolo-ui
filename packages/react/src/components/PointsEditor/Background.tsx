import clsx from 'clsx'
import { ComponentPropsWithoutRef } from 'react'

/** @category PointsEditor */
export function Background({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx('tremolo-points-editor-background', className)}
      {...props}
    >
      {children}
    </div>
  )
}
