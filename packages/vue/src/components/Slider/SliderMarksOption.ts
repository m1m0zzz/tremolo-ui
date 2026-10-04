import {
  type ComponentObjectPropsOptions,
  computed,
  defineComponent,
  type ExtractPublicPropTypes,
  h,
  type PropType,
} from 'vue'

import { cssLength, valuePercent } from '@tremolo-ui/dom'

import { checkPlacement } from '../_util/placement'

import { useSliderContext } from './context'

const sliderMarksOptionProps = {
  /** Where the mark sits, on the same scale as the thumb. */
  value: { type: Number, required: true },
  /** Draw the mark itself. @default true */
  mark: { type: Boolean, default: true },
  /**
   * Text shown next to the mark. Leave it out to show the value; `null`
   * leaves the label out.
   */
  label: {
    type: [Number, String, null] as PropType<number | string | null>,
    default: undefined,
  },
  /** Thickness of the mark. Sets `--thickness`. */
  thickness: [Number, String],
  /** Length of the mark. Sets `--length`. */
  length: [Number, String],
  /** Space between the mark and the label. Sets `--gap`. */
  gap: [Number, String],
  /** Classes for the mark and the label inside the option. */
  classes: Object as PropType<{ mark?: string; label?: string }>,
  /** Styles for the mark and the label inside the option. */
  styles: Object as PropType<{ mark?: string; label?: string }>,
} satisfies ComponentObjectPropsOptions

export type SliderMarksOptionProps = ExtractPublicPropTypes<
  typeof sliderMarksOptionProps
>

/** One mark along the slider, and its label. */
export const SliderMarksOption = /* @__PURE__ */ defineComponent({
  name: 'SliderMarksOption',
  props: sliderMarksOptionProps,
  setup(props) {
    const slider = useSliderContext()
    checkPlacement('SliderMarksOption', 'SliderMarks')
    // The marks sit on the same curve the thumb runs along.
    const percent = computed(() =>
      valuePercent(
        props.value,
        { min: slider.min, max: slider.max, scale: slider.scale },
        (slider.orientation === 'vertical') !== slider.reverse,
      ),
    )
    return () => {
      const orientation = slider.orientation
      return h(
        'div',
        {
          'data-orientation': orientation,
          style: {
            '--thickness': cssLength(props.thickness),
            '--length': cssLength(props.length),
            '--gap': cssLength(props.gap),
            position: 'absolute',
            translate:
              slider.orientation === 'vertical'
                ? 'var(--translate, 0 -50%)'
                : 'var(--translate, -50% 0)',
            zIndex: 10,
            left:
              slider.orientation === 'vertical'
                ? undefined
                : `${percent.value}%`,
            top:
              slider.orientation === 'vertical'
                ? `${percent.value}%`
                : undefined,
          },
        },
        [
          props.mark
            ? h('div', {
                class: props.classes?.mark,
                style: props.styles?.mark,
                'data-orientation': orientation,
              })
            : null,
          props.label !== null
            ? h(
                'div',
                { class: props.classes?.label, style: props.styles?.label },
                String(props.label ?? props.value),
              )
            : null,
        ],
      )
    }
  },
})
