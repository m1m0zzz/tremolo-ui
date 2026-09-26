import {
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  watchEffect,
  type PropType,
} from 'vue'

import { toXY, type XYInput } from '@tremolo-ui/dom'

import { checkPlacement } from '../_util/placement'
import { visuallyHiddenRangeInput } from '../_util/visually-hidden-range-input'

import { useXYPadContext } from './context'

type PerAxis = XYInput<string | undefined>

/** The thumb, placed at the value, with one range input per axis inside. */
export const XYPadThumb = /* @__PURE__ */ defineComponent({
  name: 'XYPadThumb',
  inheritAttrs: false,
  props: {
    /** Sets `--color`, for the theme to colour the thumb with. */
    color: String,
    /** The accessible name of each axis, as `[x, y]`. */
    ariaLabel: [String, Array] as PropType<PerAxis>,
    /** The ids of what labels each axis, as `[x, y]` or one for both. */
    ariaLabelledby: [String, Array] as PropType<PerAxis>,
    /** The ids of what describes each axis, as `[x, y]` or one for both. */
    ariaDescribedby: [String, Array] as PropType<PerAxis>,
    /** What the value of each axis means, as `[x, y]` or one for both. */
    ariaValuetext: [String, Array] as PropType<PerAxis>,
  },
  setup(props, { slots, attrs, expose }) {
    const pad = useXYPadContext()
    checkPlacement('XYPadThumb', 'XYPadArea')
    const x = ref<HTMLInputElement | null>(null)
    const y = ref<HTMLInputElement | null>(null)
    watchEffect(() => pad.setThumb(x.value))
    onBeforeUnmount(() => pad.setThumb(null))

    expose({
      focus: () => {
        if (!pad.disabled) x.value?.focus()
      },
      blur: () => {
        x.value?.blur()
        y.value?.blur()
      },
    })

    function input(axis: 0 | 1) {
      const labels = toXY(props.ariaLabel)
      return visuallyHiddenRangeInput({
        ref: axis === 0 ? x : y,
        'data-axis': axis === 0 ? 'x' : 'y',
        value: pad.value[axis],
        min: pad.min[axis],
        max: pad.max[axis],
        step: pad.step[axis],
        disabled: pad.disabled,
        'aria-readonly': pad.readonly,
        'aria-orientation': axis === 0 ? 'horizontal' : 'vertical',
        'aria-label': labels[axis] ?? (axis === 0 ? 'x' : 'y'),
        'aria-labelledby': toXY(props.ariaLabelledby)[axis],
        'aria-describedby': toXY(props.ariaDescribedby)[axis],
        'aria-valuetext': toXY(props.ariaValuetext)[axis],
        onInput: (event: Event) => {
          const target = event.target as HTMLInputElement
          if (pad.readonly) {
            target.value = String(pad.value[axis])
            return
          }
          const next = [...pad.value] as [number, number]
          next[axis] = target.valueAsNumber
          pad.change(next)
        },
      })
    }

    return () => {
      const { style, ...rest } = attrs
      return h(
        'div',
        {
          'data-disabled': pad.disabled ? '' : undefined,
          'data-readonly': pad.readonly ? '' : undefined,
          ...rest,
          style: [
            {
              position: 'absolute',
              translate: 'var(--translate, -50% -50%)',
              zIndex: 100,
              '--color': props.color,
            },
            style,
            { left: `${pad.percent[0]}%`, top: `${pad.percent[1]}%` },
          ],
        },
        [input(0), input(1), slots.default?.()],
      )
    }
  },
})
