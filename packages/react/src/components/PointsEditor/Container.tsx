import clsx from 'clsx'
import { ComponentPropsWithoutRef, useRef } from 'react'

import { usePointsEditorContext } from './context'

/** @category PointsEditor */
export function Container({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const containerElementRef = useRef<HTMLDivElement>(null)
  const setContainerElementRef = usePointsEditorContext(
    (s) => s.setContainerElementRef,
  )
  setContainerElementRef(containerElementRef)

  return (
    <div
      ref={containerElementRef}
      className={clsx('tremolo-points-editor-container', className)}
      {...props}
    >
      {children}
    </div>
  )
}
