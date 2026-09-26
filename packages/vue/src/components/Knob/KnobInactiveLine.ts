import { defineComponent, h } from 'vue'

import { knobArcPath, knobArcRadius } from '@tremolo-ui/dom'

import { checkPlacement } from '../_util/placement'

import { useKnobContext } from './context'

/**
 * The travel outside the value, as SVG `<path>`s: one on each side of the
 * active arc that has any length.
 */
export const KnobInactiveLine = /* @__PURE__ */ defineComponent({
  name: 'KnobInactiveLine',
  inheritAttrs: false,
  props: {
    stroke: { type: String, default: 'currentColor' },
    strokeWidth: { type: [Number, String], default: 6 },
  },
  setup(props, { attrs }) {
    checkPlacement('KnobInactiveLine', 'KnobSVGRoot')
    const knob = useKnobContext()
    const path = (from: number, to: number) =>
      h('path', {
        ...attrs,
        d: knobArcPath(from, to, knobArcRadius(props.strokeWidth)),
        fill: 'none',
        stroke: props.stroke,
        'stroke-width': props.strokeWidth,
      })
    return () => [
      knob.startValue > knob.min ? path(knob.angles.r1, knob.angles.r2) : null,
      knob.startValue < knob.max ? path(knob.angles.r3, knob.angles.r4) : null,
    ]
  },
})
