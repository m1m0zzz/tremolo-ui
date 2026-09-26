import { computed, defineComponent, h, provide, ref, type PropType } from 'vue'

import {
  commitNumberInputText,
  numberInputBounds,
  numberInputRanges,
  nudgeNumberInput,
  parseLeadingNumber,
  wheelDirection,
} from '@tremolo-ui/dom'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useWheel } from '../../composables/useWheel'
import { inputProps } from '../_util/props'
import { useCheckSteps } from '../_util/useCheckSteps'

import { NumberInputKey } from './context'

/** Input with some useful functions for entering numbers. Bind it with `v-model`. */
export const NumberInput = /* @__PURE__ */ defineComponent({
  name: 'NumberInput',
  props: {
    /** The current value. Bind it with `v-model`. */
    modelValue: { type: Number, required: true },
    /** The lowest value. Leave it out for no lower end. */
    min: Number,
    /** The highest value. Leave it out for no upper end. */
    max: Number,
    /** Granularity of the value. @default 1 */
    step: { type: Number, default: 1 },
    /** How the value is distributed, for a `normalized` amount. */
    scale: { type: Object as PropType<Scale>, default: () => linearScale },
    /** The text shown for a value. @default String */
    format: {
      type: Function as PropType<(value: number) => string>,
      default: String,
    },
    /** Read a value back out of the text. Has to undo `format`. */
    parse: {
      type: Function as PropType<(text: string) => number>,
      default: parseLeadingNumber,
    },
    /** Keep the value within `min` and `max` when committed or stepped. */
    clampValue: { type: Boolean, default: true },
    ...inputProps,
    /** Pixels of vertical drag on the stepper per `step`. `null` turns it off. */
    drag: { type: Number as PropType<number | null>, default: 1 },
    /** Hide the cursor while dragging the stepper. */
    pointerLock: Boolean,
    /** Select the text when the field takes focus. @default 'none' */
    selectOnFocus: {
      type: String as PropType<'all' | 'number' | 'none'>,
      default: 'none',
    },
    /** Show the plain value while the field has focus. */
    unformatOnFocus: Boolean,
    /** Put the caret back at the same digit after an arrow key step. */
    keepCaretOnStep: Boolean,
    /** Commit and leave the field on Enter. @default true */
    blurOnEnter: { type: Boolean, default: true },
    /** Make the input unchangeable and remove it from the tab order. */
    disabled: Boolean,
    /** Make the value unchangeable while leaving the field focusable. */
    readonly: Boolean,
  },
  emits: {
    'update:modelValue': (value: number) => typeof value === 'number',
  },
  setup(props, { slots, emit, expose }) {
    const root = ref<HTMLDivElement | null>(null)
    /**
     * The text being typed. The only state here: not a copy of the value, but
     * the half-finished entry that has no value to be derived from yet.
     */
    const draft = ref<string | null>(null)
    let input: HTMLInputElement | null = null

    const inactive = computed(() => props.disabled || props.readonly)
    const ranges = computed(() =>
      numberInputRanges({
        min: props.min,
        max: props.max,
        step: props.step,
        scale: props.scale,
        clampValue: props.clampValue,
      }),
    )
    const bounds = computed(() =>
      numberInputBounds(props.modelValue, {
        min: props.min,
        max: props.max,
        clampValue: props.clampValue,
      }),
    )
    const text = computed(() => draft.value ?? props.format(props.modelValue))

    // An open end has no travel to sample, so the check is skipped.
    useCheckSteps(() => ({
      component: 'NumberInput',
      range:
        props.min !== undefined &&
        props.max !== undefined &&
        props.min < props.max
          ? {
              min: props.min,
              max: props.max,
              step: props.step,
              scale: props.scale,
            }
          : null,
      keyboard: props.keyboard,
      wheel: props.wheel,
      format: props.format,
    }))

    function changeValue(next: number) {
      if (inactive.value) return
      draft.value = null
      if (next !== props.modelValue) emit('update:modelValue', next)
    }

    provide(NumberInputKey, {
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
      get disabled() {
        return props.disabled
      },
      get readonly() {
        return props.readonly
      },
      get keyboard() {
        return props.keyboard
      },
      get drag() {
        return props.drag
      },
      get dragSensitivity() {
        return props.dragSensitivity
      },
      get pointerLock() {
        return props.pointerLock
      },
      get selectOnFocus() {
        return props.selectOnFocus
      },
      get unformatOnFocus() {
        return props.unformatOnFocus
      },
      get keepCaretOnStep() {
        return props.keepCaretOnStep
      },
      get blurOnEnter() {
        return props.blurOnEnter
      },
      get text() {
        return text.value
      },
      get editing() {
        return draft.value !== null
      },
      get outOfRange() {
        return draft.value === null && bounds.value.outOfRange
      },
      get atMin() {
        return bounds.value.atMin
      },
      get atMax() {
        return bounds.value.atMax
      },
      get rawRange() {
        return ranges.value.raw
      },
      setDraft: (next) => {
        if (inactive.value) return
        draft.value = next
        // Deliberately unclamped: clamping here would make "1500" impossible
        // to type into an input whose max is 100.
        const parsed = props.parse(next)
        if (Number.isFinite(parsed)) emit('update:modelValue', parsed)
      },
      commitDraft: () => {
        if (draft.value === null || inactive.value) return
        const committed = commitNumberInputText(draft.value, props.parse, {
          min: props.min,
          max: props.max,
          clampValue: props.clampValue,
        })
        // Text with no number is not a value: the field goes back to what it
        // was showing.
        if (committed === null) draft.value = null
        else changeValue(committed)
      },
      changeValue,
      nudge: (direction, option, modifiers) =>
        changeValue(
          nudgeNumberInput(
            props.modelValue,
            direction,
            option,
            ranges.value,
            modifiers,
          ),
        ),
      setInput: (element) => {
        input = element
      },
    })

    useWheel(
      root,
      (event) => {
        const direction = wheelDirection(event)
        if (!props.wheel || inactive.value || direction === null) return
        event.preventDefault()
        changeValue(
          nudgeNumberInput(
            props.modelValue,
            direction,
            props.wheel,
            ranges.value,
            event,
          ),
        )
      },
      { requireFocus: true },
    )

    expose({
      focus: () => {
        if (!props.disabled) input?.focus()
      },
      blur: () => input?.blur(),
    })

    return () =>
      h(
        'div',
        {
          ref: root,
          'data-disabled': props.disabled ? '' : undefined,
          'data-readonly': props.readonly ? '' : undefined,
        },
        slots.default?.(),
      )
  },
})
