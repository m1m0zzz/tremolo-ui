import { defineComponent, h } from 'vue'

import { checkPlacement } from '../_util/placement'

import { usePointsEditorContext } from './context'

/**
 * The box a drag on empty space draws. Nothing is rendered while no drag is
 * running, and it takes none of the pointer.
 */
export const PointsEditorSelectionBox = /* @__PURE__ */ defineComponent({
  name: 'PointsEditorSelectionBox',
  setup(_, { slots }) {
    const points = usePointsEditorContext()
    checkPlacement('PointsEditorSelectionBox', 'PointsEditorContainer')
    return () => {
      const box = points.selectionBox
      if (!box) return null
      return h(
        'div',
        {
          style: {
            position: 'absolute',
            zIndex: 20,
            pointerEvents: 'none',
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
          },
        },
        slots.default?.(),
      )
    }
  },
})
