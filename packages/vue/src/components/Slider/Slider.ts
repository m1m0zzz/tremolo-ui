import {
  type ComponentObjectPropsOptions,
  computed,
  defineComponent,
  type ExtractPublicPropTypes,
  h,
  type PropType,
  provide,
  ref,
} from 'vue'

import {
  applyDelta,
  arrowKeyDirection,
  elementMapping,
  selectModifier,
  valuePercent,
  wheelDirection,
  type AxisOptions,
  type ChangeSource,
  type XY,
} from '@tremolo-ui/dom'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useDragValue } from '../../composables/useDragValue'
import { useWheel } from '../../composables/useWheel'
import { useChangeGesture } from '../_util/change-gesture'
import { dragSensitivityProp, keyboardProp, wheelProp } from '../_util/props'
import { useCheckSteps } from '../_util/useCheckSteps'

import { SliderKey } from './context'

const sliderProps = {
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
  /**
   * Which way the slider runs. A vertical slider grows upwards.
   * @default 'horizontal'
   */
  orientation: {
    type: String as PropType<'horizontal' | 'vertical'>,
    default: 'horizontal',
  },
  /** Grow the value the other way. */
  reverse: Boolean,
  /** The cursor to show while dragging. @default 'pointer' */
  dragCursor: { type: String, default: 'pointer' },
  wheel: wheelProp,
  keyboard: keyboardProp,
  dragSensitivity: dragSensitivityProp,
  /** Make the slider unchangeable and remove it from the tab order. */
  disabled: Boolean,
  /** Make the value unchangeable. */
  readonly: Boolean,
  /**
   * How long after the last wheel notch or arrow key a change counts as over,
   * in milliseconds, for `change-end`.
   * @default 500
   */
  changeEndDelay: { type: Number, default: 500 },
} satisfies ComponentObjectPropsOptions

export type SliderProps = ExtractPublicPropTypes<typeof sliderProps>

/** Customizable slider. Bind the value with `v-model`. */
export const Slider = /* @__PURE__ */ defineComponent({
  name: 'Slider',
  props: sliderProps,
  emits: {
    'update:modelValue': (value: number) => typeof value === 'number',
    /**
     * A change of the value started, with the value before it and what it is
     * made with.
     */
    changeStart: (value: number, _source: ChangeSource) =>
      typeof value === 'number',
    /** The change ended, with the value it ended on. */
    changeEnd: (value: number, _source: ChangeSource) =>
      typeof value === 'number',
  },
  setup(props, { slots, emit, expose }) {
    const root = ref<HTMLDivElement | null>(null)
    let track: HTMLElement | null = null
    let thumb: HTMLInputElement | null = null

    const inactive = computed(() => props.disabled || props.readonly)
    // Measured from the left or the top, as CSS places things: vertical and
    // reverse each flip it, and together they cancel out.
    const vertical = computed(() => props.orientation === 'vertical')
    const displayReversed = computed(() => vertical.value !== props.reverse)
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

    const gesture = useChangeGesture({
      value: () => props.modelValue,
      inactive: () => inactive.value,
      endDelay: () => props.changeEndDelay,
      onStart: (value, source) => emit('changeStart', value, source),
      onEnd: (value, source) => emit('changeEnd', value, source),
    })
    const change = (next: number) => {
      gesture.changed(next)
      emit('update:modelValue', next)
    }

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
      get orientation() {
        return props.orientation
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

    const valueOf = (v: XY<number>) => v[vertical.value ? 1 : 0]

    useDragValue(root, () => ({
      axis: axis.value,
      mapping: elementMapping(() => track, {
        sensitivity: (state) =>
          selectModifier(props.dragSensitivity, state.event).value,
      }),
      cursor: inactive.value ? undefined : props.dragCursor,
      shouldStart: () => !inactive.value,
      updateOnPointerDown: true,
      onChange: (v) => {
        if (!inactive.value) change(valueOf(v))
      },
      onDragStart: () => {
        if (inactive.value) return
        gesture.hold('pointer')
        thumb?.focus()
      },
      onDragEnd: () => gesture.end(),
    }))

    useWheel(
      root,
      (event) => {
        if (!props.wheel || inactive.value) return
        // A notch the slider does not read — a sideways scroll on a vertical
        // slider — is left to the page rather than swallowed.
        const direction = wheelDirection(event, { horizontal: !vertical.value })
        if (direction === null) return
        event.preventDefault()
        gesture.pulse('wheel')
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
          'data-orientation': props.orientation,
          'data-disabled': props.disabled ? '' : undefined,
          'data-readonly': props.readonly ? '' : undefined,
          onKeydown: (event: KeyboardEvent) => {
            const direction = arrowKeyDirection(event.key)
            if (direction === null) return
            event.preventDefault()
            if (!props.keyboard || inactive.value) return
            gesture.pulse('keyboard')
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
