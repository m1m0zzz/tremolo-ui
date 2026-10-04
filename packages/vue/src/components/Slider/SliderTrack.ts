import {
  type ComponentObjectPropsOptions,
  defineComponent,
  type ExtractPublicPropTypes,
  h,
  onBeforeUnmount,
  ref,
  watchEffect,
} from 'vue'

import { cssLength } from '@tremolo-ui/dom'

import { providePlacement } from '../_util/placement'

import { useSliderContext } from './context'

const sliderTrackProps = {
  /** How long the track is along the axis the slider runs. Sets `--length`. */
  length: [Number, String],
  /** How thick the track is across that axis. Sets `--thickness`. */
  thickness: [Number, String],
  /** Colour of the part from `min` to the value. Sets `--active-color`. */
  activeColor: String,
  /** Colour of the rest of the track. Sets `--inactive-color`. */
  inactiveColor: String,
} satisfies ComponentObjectPropsOptions

export type SliderTrackProps = ExtractPublicPropTypes<typeof sliderTrackProps>

/** The track the thumb runs along, and what the pointer is measured against. */
export const SliderTrack = /* @__PURE__ */ defineComponent({
  name: 'SliderTrack',
  props: sliderTrackProps,
  setup(props, { slots }) {
    const slider = useSliderContext()
    providePlacement('SliderTrack')
    const el = ref<HTMLDivElement | null>(null)
    watchEffect(() => slider.setTrack(el.value))
    onBeforeUnmount(() => slider.setTrack(null))
    // `--percent` is where the value sits, for the theme to paint the fill
    // with: the one number CSS cannot work out on its own.
    return () =>
      h(
        'div',
        {
          ref: el,
          'data-disabled': slider.disabled ? '' : undefined,
          'data-orientation': slider.orientation,
          'data-flipped':
            (slider.orientation === 'vertical') !== slider.reverse
              ? ''
              : undefined,
          style: {
            '--active-color': props.activeColor,
            '--inactive-color': props.inactiveColor,
            '--length': cssLength(props.length),
            '--thickness': cssLength(props.thickness),
            '--percent': `${slider.percent}%`,
            position: 'relative',
          },
        },
        slots.default?.(),
      )
  },
})
