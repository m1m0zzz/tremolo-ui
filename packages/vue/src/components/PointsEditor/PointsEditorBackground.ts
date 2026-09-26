import { defineComponent, h } from 'vue'

/**
 * Behind the points, filling the editor. The order of the layers holds
 * whichever way they are written, so the z-index is part of the mechanics.
 */
export const PointsEditorBackground = /* @__PURE__ */ defineComponent({
  name: 'PointsEditorBackground',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        { style: { position: 'absolute', inset: 0, zIndex: 0 } },
        slots.default?.(),
      )
  },
})
