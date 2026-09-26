import { defineComponent, h, onBeforeUnmount, ref, watchEffect } from 'vue'

import { checkPlacement } from '../_util/placement'
import { visuallyHiddenRangeInput } from '../_util/visually-hidden-range-input'

import { useSliderContext } from './context'

/**
 * The thumb, placed at the value. The ARIA (`aria-label` and friends) lands
 * on the range input inside it, which is the control and takes the focus.
 */
export const SliderThumb = /* @__PURE__ */ defineComponent({
  name: 'SliderThumb',
  inheritAttrs: false,
  props: {
    /** Sets `--color`, for the theme to colour the thumb with. */
    color: String,
  },
  setup(props, { slots, attrs, expose }) {
    const slider = useSliderContext()
    checkPlacement('SliderThumb', 'SliderTrack')
    const input = ref<HTMLInputElement | null>(null)
    watchEffect(() => slider.setThumb(input.value))
    onBeforeUnmount(() => slider.setThumb(null))

    expose({
      focus: () => {
        if (!slider.disabled) input.value?.focus()
      },
      blur: () => input.value?.blur(),
    })

    return () => {
      const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        'aria-valuetext': ariaValuetext,
        style,
        ...rest
      } = attrs
      return h(
        'div',
        {
          'data-disabled': slider.disabled ? '' : undefined,
          'data-readonly': slider.readonly ? '' : undefined,
          ...rest,
          // Placed by a percentage of the track, measured from its own
          // centre; where it sits comes after the caller's style.
          style: [
            {
              position: 'absolute',
              translate: 'var(--translate, -50% -50%)',
              zIndex: 100,
              '--color': props.color,
            },
            style,
            {
              top: slider.vertical ? `${slider.percent}%` : '50%',
              left: slider.vertical ? '50%' : `${slider.percent}%`,
            },
          ],
        },
        [
          visuallyHiddenRangeInput({
            ref: input,
            value: slider.value,
            min: slider.min,
            max: slider.max,
            step: slider.step,
            disabled: slider.disabled,
            'aria-readonly': slider.readonly,
            'aria-orientation': slider.vertical ? 'vertical' : 'horizontal',
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledby,
            'aria-describedby': ariaDescribedby,
            'aria-valuetext': ariaValuetext,
            onInput: (event: Event) => {
              const target = event.target as HTMLInputElement
              if (slider.readonly) {
                target.value = String(slider.value)
                return
              }
              slider.change(target.valueAsNumber)
            },
          }),
          slots.default?.(),
        ],
      )
    }
  },
})
