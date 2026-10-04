import {
  type ComponentObjectPropsOptions,
  computed,
  defineComponent,
  type ExtractPublicPropTypes,
  h,
  type PropType,
} from 'vue'

import { cssLength, sliderMarks, type MarksOptions } from '@tremolo-ui/dom'

import { providePlacement } from '../_util/placement'

import { useSliderContext } from './context'
import { SliderMarksOption } from './SliderMarksOption'

const sliderMarksProps = {
  /** Space between the marks and the track. Sets `--gap`. */
  gap: [Number, String],
  /**
   * Build the marks instead of writing `SliderMarksOption` out: a number
   * puts one every that many, `'step'` one every `step`. The default slot
   * is ignored while it is set.
   */
  options: [String, Number, Object] as PropType<MarksOptions>,
} satisfies ComponentObjectPropsOptions

export type SliderMarksProps = ExtractPublicPropTypes<typeof sliderMarksProps>

/** The marks along the slider: written out as options, or built from `options`. */
export const SliderMarks = /* @__PURE__ */ defineComponent({
  name: 'SliderMarks',
  props: sliderMarksProps,
  setup(props, { slots }) {
    const slider = useSliderContext()
    providePlacement('SliderMarks')
    const marks = computed(() => {
      if (props.options === undefined) return []
      const list = sliderMarks(
        props.options,
        slider.min,
        slider.max,
        slider.step,
      )
      // In the order they are on screen.
      return (slider.orientation === 'vertical') !== slider.reverse
        ? list.reverse()
        : list
    })
    // Each option inside is placed against this box.
    return () =>
      h(
        'div',
        {
          'data-orientation': slider.orientation,
          style: { '--gap': cssLength(props.gap), position: 'relative' },
        },
        props.options !== undefined
          ? marks.value.map(({ value, mark, label }) =>
              h(SliderMarksOption, {
                key: value,
                value,
                mark,
                label: label ? undefined : null,
              }),
            )
          : slots.default?.(),
      )
  },
})
