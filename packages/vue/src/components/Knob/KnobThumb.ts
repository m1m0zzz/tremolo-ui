import { defineComponent, h, type PropType } from 'vue'

import { KNOB_VIEWBOX_SIZE } from '@tremolo-ui/dom'
import { clamp } from '@tremolo-ui/functions'

import { checkPlacement } from '../_util/placement'

import { useKnobContext } from './context'

/** The circle that turns with the value, and the line on it that points at it. */
export const KnobThumb = /* @__PURE__ */ defineComponent({
  name: 'KnobThumb',
  props: {
    /** Fill colour of the circle. @default 'currentColor' */
    color: { type: String, default: 'currentColor' },
    /** Colour of the line that points at the value. @default 'currentColor' */
    lineColor: { type: String, default: 'currentColor' },
    /** Diameter of the circle, as a percentage of the knob. @default 84 */
    size: { type: Number, default: 84 },
    /** Thickness of the line, as a percentage of the knob. @default 6 */
    lineWeight: { type: Number, default: 6 },
    /** How far down the line reaches, as a percentage. @default 35 */
    lineLength: { type: Number, default: 35 },
    /** Classes for the line that points at the value. */
    classes: Object as PropType<{ line?: string }>,
  },
  setup(props) {
    checkPlacement('KnobThumb', 'KnobSVGRoot')
    const knob = useKnobContext()
    return () =>
      h('svg', null, [
        h('circle', {
          cx: '50%',
          cy: '50%',
          r: `${props.size / 2}%`,
          fill: props.color,
        }),
        h('line', {
          class: props.classes?.line,
          x1: '50%',
          y1: `${(KNOB_VIEWBOX_SIZE - clamp(props.size, 0, 100)) / 2}%`,
          x2: '50%',
          y2: `${props.lineLength}%`,
          stroke: props.lineColor,
          'stroke-width': `${props.lineWeight}%`,
          style: {
            transform: `rotate(${knob.angles.r1 + knob.angles.p * knob.angleRange}deg)`,
            transformOrigin: '50% 50%',
          },
        }),
      ])
  },
})
