import { computed, defineComponent, h, provide, ref, type PropType } from 'vue'

import {
  applyDelta,
  arrowKeyMove,
  elementMapping,
  selectModifier,
  toXY,
  valuePercent,
  wheelMove,
  type AxisMove,
  type AxisOptions,
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
  type XY,
  type XYInput,
} from '@tremolo-ui/dom'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useDragValue } from '../../composables/useDragValue'
import { useWheel } from '../../composables/useWheel'
import { inputProps } from '../_util/props'
import { useCheckSteps } from '../_util/useCheckSteps'

import { XYPadKey } from './context'

/**
 * Two-dimensional slider. The per-axis settings are `[x, y]` tuples, and a
 * plain value applies to both axes. Bind the value with `v-model`.
 */
export const XYPad = /* @__PURE__ */ defineComponent({
  name: 'XYPad',
  props: {
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
    /** The cursor to show while dragging. @default { cursor: 'pointer' } */
    externalStyles: Object as PropType<{ cursor?: string }>,
    ...inputProps,
    /** Make the pad unchangeable and remove it from the tab order. */
    disabled: Boolean,
    /** Make the value unchangeable. */
    readonly: Boolean,
  },
  emits: {
    'update:modelValue': (value: XY<number>) => Array.isArray(value),
    dragStart: (value: XY<number>) => Array.isArray(value),
    dragEnd: (value: XY<number>) => Array.isArray(value),
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

    const change = (next: XY<number>) => emit('update:modelValue', next)

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
      cursor: inactive.value
        ? undefined
        : (props.externalStyles?.cursor ?? 'pointer'),
      shouldStart: () => !inactive.value,
      onChange: (v) => {
        if (!inactive.value) change(v)
      },
      onDragStart: (v) => {
        if (inactive.value) return
        thumb?.focus()
        emit('dragStart', v)
      },
      onDragEnd: (v) => {
        if (!inactive.value) emit('dragEnd', v)
      },
    }))

    useWheel(
      root,
      (event) => {
        if (!props.wheel || inactive.value) return
        const move = wheelMove(event)
        if (!move) return
        event.preventDefault()
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
