import { ComponentPropsWithoutRef, forwardRef } from 'react'

import { POINT_AXIS, wheelMove } from '@tremolo-ui/dom'

import { useComposedRefs } from '../../compose-refs'
import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { Placement } from '../_util/Placement'

import { usePointsEditorContext } from './context'

type Props = ComponentPropsWithoutRef<'div'>

export const Container = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  function Container({ children, className, style, ...props }, forwardedRef) {
    const { containerRef, disabled, selectable, editor } =
      usePointsEditorContext()
    const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
      axis: POINT_AXIS,
      baseElementRef: containerRef,
      // A press that landed on a point belongs to that point. Declining here
      // rather than in onDragStart matters: by then the container would already
      // have taken the pointer capture away from the point.
      shouldStart: (event) =>
        !disabled && !editor.isPointElement(event.target as Element | null),
      onDragStart: ([x, y], state) => {
        editor.beginSelectionBox({ x, y }, state.event)
      },
      onChange: ([x, y]) => editor.moveSelectionBox({ x, y }),
      onDragEnd: () => editor.endSelectionBox(),
    })

    // One listener for the whole editor rather than one per point: a wheel
    // event only reaches what the cursor is over, and a point is a 16px
    // target, so the focused point takes it from anywhere over the editor —
    // the way it does for Slider and XYPad.
    useWheel(
      (event) => {
        // Scrolling up moves the point towards y = 0; shift switches to x.
        const move = wheelMove(event)
        if (!move) return
        const axis = move.axis === 0 ? 'x' : 'y'
        if (editor.nudgeFocusedPoint(axis, move.direction, event)) {
          event.preventDefault()
        }
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
