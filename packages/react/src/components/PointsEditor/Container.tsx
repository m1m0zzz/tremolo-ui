import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react'

import { useComposedRefs } from '../../compose-refs'
import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { Placement } from '../_util/Placement'

import { usePointsEditorContext } from './context'
import { AXIS } from './Point'

export interface PointsEditorContainerProps {
  /** `<PointsEditor.Point />` goes here. */
  children?: ReactNode
}

type Props = PointsEditorContainerProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorContainerProps>

export const Container = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  function Container({ children, className, style, ...props }, forwardedRef) {
    const {
      containerRef,
      disabled,
      selectable,
      isPointElement,
      nudgeFocusedPoint,
      beginSelectionBox,
      moveSelectionBox,
      endSelectionBox,
    } = usePointsEditorContext()
    const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
      axis: AXIS,
      baseElementRef: containerRef,
      // A press that landed on a point belongs to that point. Declining here
      // rather than in onDragStart matters: by then the container would already
      // have taken the pointer capture away from the point.
      shouldStart: (event) =>
        !disabled && !isPointElement(event.target as Element | null),
      onDragStart: ([x, y], state) => {
        beginSelectionBox({ x, y }, state.event)
      },
      onChange: ([x, y]) => moveSelectionBox({ x, y }),
      onDragEnd: endSelectionBox,
    })

    // One listener for the whole editor rather than one per point: a wheel
    // event only reaches what the cursor is over, and a point is a 16px
    // target, so the focused point takes it from anywhere over the editor —
    // the way it does for Slider and XYPad.
    useWheel(
      (event) => {
        // Scrolling up moves the point towards y = 0; shift switches to x.
        // Browsers turn shift+wheel into horizontal scrolling: `deltaY` comes
        // out empty and `deltaX` carries the movement. Reading whichever axis
        // moved keeps shift working as the x-axis modifier — and picks up a
        // trackpad's own horizontal gesture, which never had a modifier.
        const horizontal = event.deltaX !== 0
        const delta = horizontal ? event.deltaX : event.deltaY
        if (delta === 0) return
        const axis = horizontal || event.shiftKey ? 'x' : 'y'
        const direction = delta < 0 ? -1 : 1
        if (nudgeFocusedPoint(axis, direction, event)) event.preventDefault()
      },
      { target: containerRef },
    )

    // The container is what the pointer position is normalized against, so the
    // context ref is composed with any ref the caller passed.
    // Only attached when there is a selection to draw: `createDrag` puts
    // `touch-action: none` on whatever it holds, and an editor that cannot
    // select has no reason to stop the page scrolling under a finger.
    const composedRef = useComposedRefs<HTMLDivElement>(
      forwardedRef,
      containerRef,
      selectable && !disabled ? dragRefCallback : undefined,
    )

    return (
      <div
        ref={composedRef}
        className={className}
        style={{
          // The points inside are placed against this box, over the
          // background and under the selection box.
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          ...style,
        }}
        {...props}
      >
        <Placement name="PointsEditor.Container">{children}</Placement>
      </div>
    )
  },
)
