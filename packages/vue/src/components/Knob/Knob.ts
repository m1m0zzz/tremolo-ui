import { computed, defineComponent, h, provide, ref, type PropType } from 'vue'

import {
  applyDelta,
  arrowKeyDirection,
  cssLength,
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
  knobAngles,
  relativeMapping,
  selectModifier,
  wheelDirection,
  type AxisOptions,
  type InputEventOption,
  type ModifierValue,
  type XY,
} from '@tremolo-ui/dom'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useDragValue } from '../../composables/useDragValue'
import { useWheel } from '../../composables/useWheel'
import { useCheckSteps } from '../_util/useCheckSteps'

import { KnobKey } from './context'

/**
 * Interactive rotary knob, drawn in SVG by `KnobSVGRoot` and the parts inside
 * it. Bind the value with `v-model`.
 */
export const Knob = /* @__PURE__ */ defineComponent({
  name: 'Knob',
  props: {
    /** The current value. Bind it with `v-model`. */
    modelValue: { type: Number, required: true },
    /** The value with the knob turned all the way down. */
    min: { type: Number, required: true },
    /** The value with the knob turned all the way up. */
    max: { type: Number, required: true },
    /** Granularity of the value. @default 1 */
    step: { type: Number, default: 1 },
    /** How the value is distributed across the travel. @default linearScale */
    scale: { type: Object as PropType<Scale>, default: () => linearScale },
    /** The value a double click restores. @default min */
    defaultValue: Number,
    /** Where the active arc starts. @default min */
    startValue: Number,
    /** Width and height of the knob. Sets `--knob-size`. */
    size: [Number, String],
    /** The cursor to show while dragging. @default { cursor: 'grabbing' } */
    externalStyles: Object as PropType<{ cursor?: string }>,
    /** How much one notch of the wheel moves the value. `null` turns it off. */
    wheel: {
      type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
      default: () => DEFAULT_WHEEL_OPTIONS,
    },
    /** How much one arrow key press moves the value. `null` turns it off. */
    keyboard: {
      type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
      default: () => DEFAULT_KEYBOARD_OPTIONS,
    },
    /** How much a drag moves the value, per modifier key. */
    dragSensitivity: {
      type: [Number, Object] as PropType<ModifierValue<number>>,
      default: () => DEFAULT_DRAG_SENSITIVITY,
    },
    /** Hide the cursor while dragging and read the movement directly. */
    pointerLock: Boolean,
    /** Restore `defaultValue` on a double click. @default true */
    enableDoubleClickDefault: { type: Boolean, default: true },
    /** Make the knob unchangeable and remove it from the tab order. */
    disabled: Boolean,
    /** Make the knob unchangeable while leaving it focusable. */
    readonly: Boolean,
    /** How far the knob turns from `min` to `max`, in degrees. @default 270 */
    angleRange: { type: Number, default: 270 },
  },
  emits: {
    'update:modelValue': (value: number) => typeof value === 'number',
  },
  setup(props, { slots, emit, expose }) {
    const root = ref<HTMLDivElement | null>(null)
    const dragging = ref(false)
    const inactive = computed(() => props.disabled || props.readonly)
    const range = computed(() => ({
      min: props.min,
      max: props.max,
      step: props.step,
      scale: props.scale,
    }))
    const angles = computed(() =>
      knobAngles({
        value: props.modelValue,
        min: props.min,
        max: props.max,
        scale: props.scale,
        startValue: props.startValue ?? props.min,
        angleRange: props.angleRange,
      }),
    )

    useCheckSteps(() => ({
      component: 'Knob',
      range: range.value,
      keyboard: props.keyboard,
      wheel: props.wheel,
    }))

    provide(KnobKey, {
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
      get startValue() {
        return props.startValue ?? props.min
      },
      get angleRange() {
        return props.angleRange
      },
      get angles() {
        return angles.value
      },
    })

    const change = (next: number) => emit('update:modelValue', next)

    // The knob has no travel of its own: 100px of movement spans the whole
    // range, and only the vertical axis carries a value, reversed so that
    // dragging up raises it.
    useDragValue(root, () => ({
      axis: [range.value, { ...range.value, reverse: true }] as XY<AxisOptions>,
      mapping: relativeMapping({
        pixelRange: 100,
        sensitivity: (state) =>
          selectModifier(props.dragSensitivity, state.event).value,
      }),
      getValue: (): XY<number> => [props.modelValue, props.modelValue],
      threshold: 1,
      cursor: inactive.value
        ? undefined
        : (props.externalStyles?.cursor ?? 'grabbing'),
      pointerLock: inactive.value ? false : props.pointerLock,
      shouldStart: () => !inactive.value,
      onChange: (v) => {
        if (!inactive.value) change(v[1])
      },
      onDragStart: () => {
        dragging.value = true
      },
      onDragEnd: () => {
        dragging.value = false
      },
    }))

    useWheel(
      root,
      (event) => {
        if (!props.wheel || inactive.value) return
        // A notch the knob does not read — a sideways scroll — is left to
        // the page rather than swallowed.
        const direction = wheelDirection(event)
        if (direction === null) return
        event.preventDefault()
        change(
          applyDelta(
            props.modelValue,
            direction,
            props.wheel,
            range.value,
            event,
          ),
        )
      },
      { requireFocus: true },
    )

    expose({
      /** Move the focus to the knob. */
      focus: () => {
        if (!props.disabled) root.value?.focus()
      },
      /** Take the focus away from the knob. */
      blur: () => root.value?.blur(),
    })

    return () =>
      h(
        'div',
        {
          ref: root,
          role: 'slider',
          tabindex: props.disabled ? -1 : 0,
          'aria-valuenow': props.modelValue,
          'aria-valuemin': props.min,
          'aria-valuemax': props.max,
          'aria-disabled': props.disabled,
          'aria-readonly': props.readonly,
          'data-disabled': props.disabled ? '' : undefined,
          'data-readonly': props.readonly ? '' : undefined,
          'data-dragging': dragging.value ? '' : undefined,
          style: { '--knob-size': cssLength(props.size) },
          onKeydown: (event: KeyboardEvent) => {
            if (!props.keyboard || inactive.value) return
            const direction = arrowKeyDirection(event.key)
            if (direction === null) return
            event.preventDefault()
            change(
              applyDelta(
                props.modelValue,
                direction,
                props.keyboard,
                range.value,
                event,
              ),
            )
          },
          onDblclick: () => {
            if (!inactive.value && props.enableDoubleClickDefault) {
              change(props.defaultValue ?? props.min)
            }
          },
        },
        slots.default?.(),
      )
  },
})
