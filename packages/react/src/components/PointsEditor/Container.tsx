import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode, Ref } from 'react'

import { useComposedRefs } from '../_util/composeRefs'
import { Placement } from '../_util/placement'

import { usePointsEditorContext } from './context'

export interface PointsEditorContainerProps {
  /** `<PointsEditor.Point />` goes here. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

export function Container({
  children,
  className,
  ref,
  ...props
}: PointsEditorContainerProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorContainerProps>) {
  const containerRef = usePointsEditorContext((s) => s.containerRef)

  // The container is what the pointer position is normalized against, so the
  // context ref is composed with any ref the caller passed.
  const composedRef = useComposedRefs<HTMLDivElement>(ref, containerRef)

  return (
    <div
      ref={composedRef}
      className={clsx('tremolo-points-editor-container', className)}
      {...props}
    >
      <Placement name="PointsEditor.Container">{children}</Placement>
    </div>
  )
}
