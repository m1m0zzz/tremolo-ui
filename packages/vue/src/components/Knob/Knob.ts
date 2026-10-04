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
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
  knobAngles,
  relativeMapping,
  type AxisOptions,
  type ChangeSource,
  type InputEventOption,
  type ModifierValue,
  type XY,
} from '@tremolo-ui/dom'
import {
  applyDelta,
  arrowKeyDirection,
  cssLength,
  selectModifier,
  wheelDirection,
} from '@tremolo-ui/dom/internal'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useDragValue } from '../../composables/useDragValue'
import { useWheel } from '../../composables/useWheel'
import { useChangeGesture } from '../_util/change-gesture'
import { useCheckSteps } from '../_util/useCheckSteps'

import { KnobKey } from './context'

const knobProps = {
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
  /**
   * The value a double click restores. `null` turns the double click off.
   * @default startValue
   */
  resetValue: {
    type: Number as PropType<number | null>,
    default: undefined,
  },
  /** Where the active arc starts. @default min */
  startValue: Number,
  /** Width and height of the knob. Sets `--knob-size`. */
  size: [Number, String],
  /** The cursor to show while dragging. @default 'grabbing' */
  dragCursor: { type: String, default: 'grabbing' },
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
  /** Make the knob unchangeable and remove it from the tab order. */
  disabled: Boolean,
  /** Make the knob unchangeable while leaving it focusable. */
  readonly: Boolean,
  /**
   * How long after the last wheel notch or arrow key a change counts as over,
   * in milliseconds, for `change-end`.
   * @default 500
   */
  changeEndDelay: { type: Number, default: 500 },
  /** How far the knob turns from `min` to `max`, in degrees. @default 270 */
  angleRange: { type: Number, default: 270 },
} satisfies ComponentObjectPropsOptions

export type KnobProps = ExtractPublicPropTypes<typeof knobProps>

/**
 * Interactive rotary knob, drawn in SVG by `KnobSVGRoot` and the parts inside
 * it. Bind the value with `v-model`.
 */
export const Knob = /* @__PURE__ */ defineComponent({
  name: 'Knob',
  props: knobProps,
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
      cursor: inactive.value ? undefined : props.dragCursor,
      pointerLock: inactive.value ? false : props.pointerLock,
      shouldStart: () => !inactive.value,
      onChange: (v) => {
        if (!inactive.value) change(v[1])
      },
      onDragStart: () => {
        dragging.value = true
        if (!inactive.value) gesture.hold('pointer')
      },
      onDragEnd: () => {
        dragging.value = false
        gesture.end()
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
        gesture.pulse('wheel')
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
            gesture.pulse('keyboard')
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
            if (!inactive.value && props.resetValue !== null) {
              gesture.instant('doubleClick', () =>
                change(props.resetValue ?? props.startValue ?? props.min),
              )
            }
          },
        },
        slots.default?.(),
      )
  },
})
