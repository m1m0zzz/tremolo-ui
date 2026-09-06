import { ComponentPropsWithoutRef, ReactNode, Ref } from 'react'

import { useDragValue } from '../../hooks/useDragValue'
import { addUserSelectNone, removeUserSelectNone } from '../_util'
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
  const {
    containerRef,
    externalStyles,
    selectable,
    marquee,
    beginMarquee,
    moveMarquee,
    endMarquee,
  } = usePointsEditorContext()

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
    onDragStart: ([x, y], state) => {
      // The band is dragged over whatever the editor sits next to, so the
      // page-wide guard applies here as it does to a point.
      if (externalStyles.userSelectNone) addUserSelectNone()
      beginMarquee({ x, y }, state.event)
    },
    onChange: ([x, y]) => moveMarquee({ x, y }),
    onDragEnd: () => {
      if (externalStyles.userSelectNone) removeUserSelectNone()
      endMarquee()
    },
  })

  // The container is what the pointer position is normalized against, so the
  // context ref is composed with any ref the caller passed.
  // Only attached when there is a selection to draw: `createDrag` puts
  // `touch-action: none` on whatever it holds, and an editor that cannot
  // select has no reason to stop the page scrolling under a finger.
  const composedRef = useComposedRefs<HTMLDivElement>(
    ref,
    containerRef,
    selectable ? dragRefCallback : undefined,
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
