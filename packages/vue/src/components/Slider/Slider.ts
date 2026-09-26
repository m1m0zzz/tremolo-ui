import { computed, defineComponent, h, provide, ref, type PropType } from 'vue'

import {
  applyDelta,
  arrowKeyDirection,
  elementMapping,
  selectModifier,
  valuePercent,
  wheelDirection,
  type AxisOptions,
  type XY,
} from '@tremolo-ui/dom'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useDragValue } from '../../composables/useDragValue'
import { useWheel } from '../../composables/useWheel'
import { inputProps } from '../_util/props'
import { useCheckSteps } from '../_util/useCheckSteps'

import { SliderKey } from './context'

/** Customizable slider. Bind the value with `v-model`. */
export const Slider = /* @__PURE__ */ defineComponent({
  name: 'Slider',
  props: {
    /** The current value. Bind it with `v-model`. */
    modelValue: { type: Number, required: true },
    /** The value at the start of the travel. */
    min: { type: Number, required: true },
    /** The value at the end of the travel. */
    max: { type: Number, required: true },
    /** Granularity of the value. @default 1 */
    step: { type: Number, default: 1 },
    /** How the value is distributed across the travel. @default linearScale */
    scale: { type: Object as PropType<Scale>, default: () => linearScale },
    /** Run the slider vertically, with the value growing upwards. */
    vertical: Boolean,
    /** Grow the value the other way. */
    reverse: Boolean,
    /** The cursor to show while dragging. @default { cursor: 'pointer' } */
    externalStyles: Object as PropType<{ cursor?: string }>,
    ...inputProps,
    /** Make the slider unchangeable and remove it from the tab order. */
    disabled: Boolean,
    /** Make the value unchangeable. */
    readonly: Boolean,
  },
  emits: {
    'update:modelValue': (value: number) => typeof value === 'number',
    /** A drag started, with the value where the track was pressed. */
    dragStart: (value: number) => typeof value === 'number',
    /** The drag ended, with the value it ended on. */
    dragEnd: (value: number) => typeof value === 'number',
  },
  setup(props, { slots, emit, expose }) {
    const root = ref<HTMLDivElement | null>(null)
    let track: HTMLElement | null = null
    let thumb: HTMLInputElement | null = null

    const inactive = computed(() => props.disabled || props.readonly)
    // Measured from the left or the top, as CSS places things: vertical and
    // reverse each flip it, and together they cancel out.
    const displayReversed = computed(() => props.vertical !== props.reverse)
    const percent = computed(() =>
      valuePercent(
        props.modelValue,
        { min: props.min, max: props.max, scale: props.scale },
        displayReversed.value,
      ),
    )
    const axis = computed((): AxisOptions => ({
      min: props.min,
      max: props.max,
      step: props.step,
      scale: props.scale,
      reverse: displayReversed.value,
    }))

    useCheckSteps(() => ({
      component: 'Slider',
      range: axis.value,
      keyboard: props.keyboard,
      wheel: props.wheel,
    }))

    const change = (next: number) => emit('update:modelValue', next)

    provide(SliderKey, {
      get value() {
        return props.modelValue
      },
      get min() {
        return props.min
      },
      get max() {
        return props.max
      },
      get step() {
        return props.step
      },
      get scale() {
        return props.scale
      },
      get vertical() {
        return props.vertical
      },
      get reverse() {
        return props.reverse
      },
      get disabled() {
        return props.disabled
      },
      get readonly() {
        return props.readonly
      },
      get percent() {
        return percent.value
      },
      change,
      setTrack: (element) => {
        track = element
      },
      setThumb: (input) => {
        thumb = input
      },
    })

    const valueOf = (v: XY<number>) => v[props.vertical ? 1 : 0]

    useDragValue(root, () => ({
      axis: axis.value,
      mapping: elementMapping(() => track, {
        sensitivity: (state) =>
          selectModifier(props.dragSensitivity, state.event).value,
      }),
      cursor: inactive.value
        ? undefined
        : (props.externalStyles?.cursor ?? 'pointer'),
      shouldStart: () => !inactive.value,
      updateOnPointerDown: true,
      onChange: (v) => {
        if (!inactive.value) change(valueOf(v))
      },
      onDragStart: (v) => {
        if (inactive.value) return
        thumb?.focus()
        emit('dragStart', valueOf(v))
      },
      onDragEnd: (v) => {
        if (!inactive.value) emit('dragEnd', valueOf(v))
      },
    }))

    useWheel(
      root,
      (event) => {
        if (!props.wheel || inactive.value) return
        event.preventDefault()
        const direction = wheelDirection(event, { horizontal: !props.vertical })
        if (direction === null) return
        change(
          applyDelta(
            props.modelValue,
            props.reverse ? -direction : direction,
            props.wheel,
            axis.value,
            event,
          ),
        )
      },
      { requireFocus: true },
    )

    expose({
      /** Move the focus to the thumb. */
      focus: () => {
        if (!props.disabled) thumb?.focus()
      },
      /** Take the focus away from the thumb. */
      blur: () => thumb?.blur(),
    })

    // The group is the pointer and keyboard event area; the range input in
    // the thumb carries the control semantics. A press lands on the track or
    // the thumb, neither of which can hold focus, and the browser answers that
    // by clearing the focus — tabindex -1 keeps it inside.
    return () =>
      h(
        'div',
        {
          ref: root,
          role: 'group',
          tabindex: -1,
          'data-orientation': props.vertical ? 'vertical' : 'horizontal',
          'data-disabled': props.disabled ? '' : undefined,
          'data-readonly': props.readonly ? '' : undefined,
          onKeydown: (event: KeyboardEvent) => {
            const direction = arrowKeyDirection(event.key)
            if (direction === null) return
            event.preventDefault()
            if (!props.keyboard || inactive.value) return
            change(
              applyDelta(
                props.modelValue,
                props.reverse ? -direction : direction,
                props.keyboard,
                axis.value,
                event,
              ),
            )
          },
          onFocus: () => {
            if (!props.disabled) thumb?.focus()
          },
          onBlur: () => thumb?.blur(),
        },
        slots.default?.(),
      )
  },
})
