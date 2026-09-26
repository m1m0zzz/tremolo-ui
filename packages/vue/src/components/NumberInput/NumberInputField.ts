import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  ref,
  watchEffect,
} from 'vue'

import {
  caretAtDecimalOffset,
  caretDecimalOffset,
  leadingNumberLength,
} from '@tremolo-ui/dom'

import { useNumberInputContext } from './context'

/**
 * The text field, and the only place the value can be typed. While the user
 * types, their own text stands rather than `format(value)`.
 */
export const NumberInputField = /* @__PURE__ */ defineComponent({
  name: 'NumberInputField',
  setup(_, { expose }) {
    const field = useNumberInputContext()
    const input = ref<HTMLInputElement | null>(null)
    const focused = ref(false)
    watchEffect(() => field.setInput(input.value))
    onBeforeUnmount(() => field.setInput(null))

    // Only until the first keystroke: from then on the draft is the user's
    // own text and stands on its own, formatted or not.
    const shown = computed(() =>
      field.unformatOnFocus && focused.value && !field.editing
        ? String(field.value)
        : field.text,
    )

    async function select() {
      if (field.selectOnFocus === 'none') return
      // Selecting has to wait for `unformatOnFocus` to swap the text in, or
      // it would cover the wrong characters.
      await nextTick()
      const element = input.value
      if (!element || !focused.value) return
      element.setSelectionRange(
        0,
        field.selectOnFocus === 'all'
          ? element.value.length
          : leadingNumberLength(element.value),
      )
    }

    async function step(direction: number, event: KeyboardEvent) {
      const element = event.currentTarget as HTMLInputElement
      const from = element.value
      const offset =
        field.keepCaretOnStep && element.selectionStart !== null
          ? caretDecimalOffset(from, element.selectionStart)
          : null
      field.nudge(direction, field.keyboard!, event)
      if (offset === null) return
      await nextTick()
      // The step may have been clamped away, leaving the text as it was.
      if (element.value === from) return
      const caret = caretAtDecimalOffset(element.value, offset)
      element.setSelectionRange(caret, caret)
    }

    expose({
      focus: () => input.value?.focus(),
      blur: () => input.value?.blur(),
    })

    // Not type="number": that brings native spinners and a value the browser
    // parses itself, neither of which survives a unit suffix.
    return () =>
      h('input', {
        ref: input,
        type: 'text',
        inputmode: 'decimal',
        role: 'spinbutton',
        value: shown.value,
        disabled: field.disabled,
        readonly: field.readonly,
        'aria-disabled': field.disabled,
        'aria-readonly': field.readonly,
        'aria-valuenow': field.value,
        'aria-valuemin': field.min,
        'aria-valuemax': field.max,
        // The formatted text even while the plain number is shown: it is the
        // one that says what the value means.
        'aria-valuetext': field.text,
        step: field.step,
        'data-disabled': field.disabled ? '' : undefined,
        'data-readonly': field.readonly ? '' : undefined,
        'data-out-of-range': field.outOfRange ? '' : undefined,
        onInput: (event: Event) =>
          field.setDraft((event.target as HTMLInputElement).value),
        onFocus: () => {
          focused.value = true
          select()
        },
        onBlur: () => {
          focused.value = false
          // Nothing was typed, so there is no draft and this returns at once.
          field.commitDraft()
        },
        onKeydown: (event: KeyboardEvent) => {
          const key = event.key
          if (key === 'Enter') {
            field.commitDraft()
            if (field.blurOnEnter) (event.target as HTMLInputElement).blur()
          } else if (
            field.keyboard &&
            !field.disabled &&
            !field.readonly &&
            (key === 'ArrowUp' || key === 'ArrowDown') &&
            // Arrow keys pick a candidate while an IME is converting.
            !event.isComposing
          ) {
            event.preventDefault()
            step(key === 'ArrowUp' ? 1 : -1, event)
          }
        },
      })
  },
})
