import { defineComponent, h } from 'vue'

import { knobArcPath, knobArcRadius } from '@tremolo-ui/dom'

import { checkPlacement } from '../_util/placement'

import { useKnobContext } from './context'

/** The arc between `startValue` and the value, as an SVG `<path>`. */
export const KnobActiveLine = /* @__PURE__ */ defineComponent({
  name: 'KnobActiveLine',
  props: {
    stroke: { type: String, default: 'currentColor' },
    strokeWidth: { type: [Number, String], default: 6 },
  },
  setup(props) {
    checkPlacement('KnobActiveLine', 'KnobSVGRoot')
    const knob = useKnobContext()
    return () =>
      h('path', {
        d: knobArcPath(
          knob.angles.r2,
          knob.angles.r3,
          knobArcRadius(props.strokeWidth),
        ),
        fill: 'none',
        stroke: props.stroke,
        'stroke-width': props.strokeWidth,
      })
  },
})
