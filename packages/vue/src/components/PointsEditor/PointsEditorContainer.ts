import { computed, defineComponent, h, ref, watch, watchEffect } from 'vue'

import {
  createDragValue,
  elementMapping,
  POINT_AXIS,
  wheelMove,
} from '@tremolo-ui/dom'

import { useWheel } from '../../composables/useWheel'
import { providePlacement } from '../_util/placement'

import { usePointsEditorContext } from './context'

/** The layer the points are placed in, over the background. */
export const PointsEditorContainer = /* @__PURE__ */ defineComponent({
  name: 'PointsEditorContainer',
  setup(_, { slots }) {
    const points = usePointsEditorContext()
    providePlacement('PointsEditorContainer')
    const el = ref<HTMLDivElement | null>(null)
    watchEffect(() => points.setContainer(el.value))

    // A drag on empty space draws a selection box. It is only attached while
    // there is a selection to draw: `createDrag` puts `touch-action: none` on
    // what it holds, and an editor that cannot select should not stop the
    // page scrolling under a finger.
    const selecting = computed(() => points.selectable && !points.disabled)
    watch(
      [el, selecting],
      ([element, on], _, onCleanup) => {
        if (!element || !on) return
        const drag = createDragValue(element, {
          axis: POINT_AXIS,
          mapping: elementMapping(() => element),
          // A press that landed on a point belongs to that point. Declining
          // here rather than later matters: by then the container would
          // already have taken the pointer capture away from the point.
          shouldStart: (event) =>
            !points.editor.isPointElement(event.target as Element | null),
          onDragStart: ([x, y], state) =>
            points.editor.beginSelectionBox({ x, y }, state.event),
          onChange: ([x, y]) => points.editor.moveSelectionBox({ x, y }),
          onDragEnd: () => points.editor.endSelectionBox(),
        })
        onCleanup(() => drag.destroy())
      },
      { immediate: true, flush: 'post' },
    )

    // One listener for the whole editor rather than one per point: a wheel
    // event only reaches what the cursor is over.
    useWheel(el, (event) => {
      // Scrolling up moves the point towards y = 0; shift switches to x.
      const move = wheelMove(event)
      if (!move) return
      const axis = move.axis === 0 ? 'x' : 'y'
      if (points.editor.nudgeFocusedPoint(axis, move.direction, event)) {
        event.preventDefault()
      }
    })

    return () =>
      h(
        'div',
        {
          ref: el,
          style: { position: 'absolute', inset: 0, zIndex: 10 },
        },
        slots.default?.(),
      )
  },
})
