import { ComponentPropsWithoutRef, ReactNode, Ref } from 'react'

import { useDragValue } from '../../hooks/useDragValue'
import { useComposedRefs } from '../_util/composeRefs'
import { cx } from '../_util/cx'
import { Placement } from '../_util/placement'

import { usePointsEditorContext } from './context'

export interface PointsEditorContainerProps {
  /** `<PointsEditor.Point />` goes here. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

/** The rubber band runs over the same 0..1 space a point's value lives in. */
const AXIS = { min: 0, max: 1 }

export function Container({
  children,
  className,
  ref,
  ...props
}: PointsEditorContainerProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorContainerProps>) {
  const { containerRef, marquee, beginMarquee, moveMarquee, endMarquee } =
    usePointsEditorContext()

  const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
    axis: AXIS,
    baseElementRef: containerRef,
    // A press that landed on a point belongs to that point. Declining here
    // rather than in onDragStart matters: by then the container would already
    // have taken the pointer capture away from the point.
    shouldStart: (event) =>
      !(event.target as Element | null)?.closest?.(
        '.tremolo-points-editor-point',
      ),
    onDragStart: ([x, y], state) => beginMarquee({ x, y }, state.event),
    onChange: ([x, y]) => moveMarquee({ x, y }),
    onDragEnd: () => endMarquee(),
  })

  // The container is what the pointer position is normalized against, so the
  // context ref is composed with any ref the caller passed.
  const composedRef = useComposedRefs<HTMLDivElement>(
    ref,
    containerRef,
    dragRefCallback,
  )

  return (
    <div
      ref={composedRef}
      className={cx('tremolo-points-editor-container', className)}
      {...props}
    >
      <Placement name="PointsEditor.Container">{children}</Placement>
      {marquee && (
        <div
          className="tremolo-points-editor-marquee"
          style={{
            left: `${marquee.x * 100}%`,
            top: `${marquee.y * 100}%`,
            width: `${marquee.width * 100}%`,
            height: `${marquee.height * 100}%`,
          }}
        />
      )}
    </div>
  )
}
