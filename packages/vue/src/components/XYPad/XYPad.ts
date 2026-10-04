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
  elementMapping,
  valuePercent,
  type AxisOptions,
  type ChangeSource,
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
  type XY,
  type XYInput,
} from '@tremolo-ui/dom'
import {
  applyDelta,
  arrowKeyMove,
  selectModifier,
  toXY,
  wheelMove,
  type AxisMove,
} from '@tremolo-ui/dom/internal'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useDragValue } from '../../composables/useDragValue'
import { useWheel } from '../../composables/useWheel'
import { useChangeGesture } from '../_util/change-gesture'
import { dragSensitivityProp, keyboardProp, wheelProp } from '../_util/props'
import { useCheckSteps } from '../_util/useCheckSteps'

import { XYPadKey } from './context'

const xyPadProps = {
  /** The current value as `[x, y]`. Bind it with `v-model`. */
  modelValue: {
    type: Array as unknown as PropType<XY<number>>,
    required: true,
  },
  /** The value at the start of the travel, per axis. */
  min: {
    type: [Number, Array] as PropType<XYInput<number>>,
    required: true,
  },
  /** The value at the end of the travel, per axis. */
  max: {
    type: [Number, Array] as PropType<XYInput<number>>,
    required: true,
  },
  /** Granularity of the value, per axis. @default 1 */
  step: { type: [Number, Array] as PropType<XYInput<number>>, default: 1 },
  /** How the value is distributed, per axis. @default linearScale */
  scale: {
    type: [Object, Array] as PropType<XYInput<Scale>>,
    default: () => linearScale,
  },
  /** Grow the value the other way, per axis. `y` grows downwards unless reversed. */
  reverse: {
    type: [Boolean, Array] as PropType<XYInput<boolean>>,
    default: false,
  },
  /** The cursor to show while dragging. @default 'pointer' */
  dragCursor: { type: String, default: 'pointer' },
  wheel: wheelProp,
  keyboard: keyboardProp,
  dragSensitivity: dragSensitivityProp,
  /** Make the pad unchangeable and remove it from the tab order. */
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

export type XYPadProps = ExtractPublicPropTypes<typeof xyPadProps>

/**
 * Two-dimensional slider. The per-axis settings are `[x, y]` tuples, and a
 * plain value applies to both axes. Bind the value with `v-model`.
 */
export const XYPad = /* @__PURE__ */ defineComponent({
  name: 'XYPad',
  props: xyPadProps,
  emits: {
    'update:modelValue': (value: XY<number>) => Array.isArray(value),
    /**
     * A change of the value started, with the value before it and what it is
     * made with.
     */
    changeStart: (value: XY<number>, _source: ChangeSource) =>
      Array.isArray(value),
    /** The change ended, with the value it ended on. */
    changeEnd: (value: XY<number>, _source: ChangeSource) =>
      Array.isArray(value),
  },
  setup(props, { slots, emit, expose }) {
    const root = ref<HTMLDivElement | null>(null)
    let area: HTMLElement | null = null
    let thumb: HTMLInputElement | null = null

    const inactive = computed(() => props.disabled || props.readonly)
    const min = computed(() => toXY(props.min))
    const max = computed(() => toXY(props.max))
    const step = computed(() => toXY(props.step))
    const scale = computed(() => toXY(props.scale))
    const reverse = computed(() => toXY(props.reverse))
    const percent = computed(
      () =>
        [0, 1].map((i) =>
          valuePercent(
            props.modelValue[i],
            { min: min.value[i], max: max.value[i], scale: scale.value[i] },
            reverse.value[i],
          ),
        ) as XY<number>,
    )
    // `reverse` only concerns the drag, where positions follow the screen; the
    // key and wheel handlers flip the direction themselves.
    const axis = computed(
      () =>
        [0, 1].map((i) => ({
          min: min.value[i],
          max: max.value[i],
          step: step.value[i],
          scale: scale.value[i],
          reverse: reverse.value[i],
        })) as XY<AxisOptions>,
    )

    for (const [i, name] of [
      [0, 'x'],
      [1, 'y'],
    ] as const) {
      useCheckSteps(() => ({
        component: 'XYPad',
        axis: name,
        range: axis.value[i],
        keyboard: props.keyboard,
        wheel: props.wheel,
      }))
    }

    const gesture = useChangeGesture({
      value: () => props.modelValue,
      inactive: () => inactive.value,
      endDelay: () => props.changeEndDelay,
      onStart: (value, source) => emit('changeStart', value, source),
      onEnd: (value, source) => emit('changeEnd', value, source),
    })
    const change = (next: XY<number>) => {
      gesture.changed(next)
      emit('update:modelValue', next)
    }

    /** Move one axis by one press of `option`, in screen coordinates. */
    function nudge(
      { axis: i, direction }: AxisMove,
      option: ModifierValue<InputEventOption>,
      modifiers: ModifierState,
    ) {
      const value = props.modelValue
      const next = applyDelta(
        value[i],
        reverse.value[i] ? -direction : direction,
        option,
        axis.value[i],
        modifiers,
      )
      change(i === 0 ? [next, value[1]] : [value[0], next])
    }

    provide(XYPadKey, {
      get value() {
        return props.modelValue
      },
      get min() {
        return min.value
      },
      get max() {
        return max.value
      },
      get step() {
        return step.value
      },
      get scale() {
        return scale.value
      },
      get reverse() {
        return reverse.value
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
      setArea: (element) => {
        area = element
      },
      setThumb: (input) => {
        thumb = input
      },
    })

    useDragValue(root, () => ({
      axis: axis.value,
      mapping: elementMapping(() => area, {
        sensitivity: (state) =>
          selectModifier(props.dragSensitivity, state.event).value,
      }),
      updateOnPointerDown: true,
      cursor: inactive.value ? undefined : props.dragCursor,
      shouldStart: () => !inactive.value,
      onChange: (v) => {
        if (!inactive.value) change(v)
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
        const move = wheelMove(event)
        if (!move) return
        event.preventDefault()
        gesture.pulse('wheel')
        nudge(move, props.wheel, event)
      },
      { requireFocus: true },
    )

    expose({
      focus: () => {
        if (!props.disabled) thumb?.focus()
      },
      blur: () => thumb?.blur(),
    })

    return () =>
      h(
        'div',
        {
          ref: root,
          role: 'group',
          tabindex: -1,
          'data-disabled': props.disabled ? '' : undefined,
          'data-readonly': props.readonly ? '' : undefined,
          onKeydown: (event: KeyboardEvent) => {
            // The key picks the axis, whichever of the two inputs holds the
            // focus: the focus lands on the x input.
            const move = arrowKeyMove(event.key)
            if (!move) return
            event.preventDefault()
            if (props.keyboard && !inactive.value) {
              gesture.pulse('keyboard')
              nudge(move, props.keyboard, event)
            }
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
