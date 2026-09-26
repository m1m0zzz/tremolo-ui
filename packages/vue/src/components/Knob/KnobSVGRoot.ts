import { defineComponent, h } from 'vue'

import { KNOB_VIEWBOX_SIZE } from '@tremolo-ui/dom'

import { providePlacement } from '../_util/placement'

/**
 * The `<svg>` the drawing parts go in, in the order you want them painted.
 * It sets the view box they are drawn against.
 */
export const KnobSVGRoot = /* @__PURE__ */ defineComponent({
  name: 'KnobSVGRoot',
  setup(_, { slots }) {
    providePlacement('KnobSVGRoot')
    return () =>
      h(
        'svg',
        {
          viewBox: `0 0 ${KNOB_VIEWBOX_SIZE} ${KNOB_VIEWBOX_SIZE}`,
          style: { display: 'block' },
        },
        slots.default?.(),
      )
  },
})
