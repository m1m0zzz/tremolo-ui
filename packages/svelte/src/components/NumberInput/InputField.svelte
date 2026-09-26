<script lang="ts">
  import {
    caretAtDecimalOffset,
    caretDecimalOffset,
    leadingNumberLength,
  } from '@tremolo-ui/dom'
  import { tick } from 'svelte'

  import { useNumberInputContext } from './context.js'

  import type { HTMLInputAttributes } from 'svelte/elements'

  // The value belongs to `NumberInput.Root`, and the field is always text.
  type Props = Omit<HTMLInputAttributes, 'type' | 'value'> & {
    ref?: HTMLInputElement | null
  }

  let {
    ref = $bindable(null),
    onfocus,
    oninput,
    onblur,
    onkeydown,
    ...rest
  }: Props = $props()

  const field = useNumberInputContext()

  $effect(() => {
    field.setInput(ref)
    return () => field.setInput(null)
  })

  let focused = $state(false)

  // Only until the first keystroke: from then on the draft is the user's own
  // text and stands on its own, formatted or not.
  const shown = $derived(
    field.unformatOnFocus && focused && !field.editing
      ? String(field.value)
      : field.text,
  )

  async function select() {
    if (field.selectOnFocus === 'none') return
    // Selecting has to wait for `unformatOnFocus` to swap the text in, or it
    // would cover the wrong characters.
    await tick()
    const input = ref
    if (!input || !focused) return
    input.setSelectionRange(
      0,
      field.selectOnFocus === 'all'
        ? input.value.length
        : leadingNumberLength(input.value),
    )
  }

  async function step(direction: number, event: KeyboardEvent) {
    const input = event.currentTarget as HTMLInputElement
    const from = input.value
    const offset =
      field.keepCaretOnStep && input.selectionStart !== null
        ? caretDecimalOffset(from, input.selectionStart)
        : null
    field.nudge(direction, field.keyboard!, event)
    if (offset === null) return
    await tick()
    // The step may have been clamped away, leaving the text as it was.
    if (input.value === from) return
    const caret = caretAtDecimalOffset(input.value, offset)
    input.setSelectionRange(caret, caret)
  }
</script>

<!-- Not type="number": that brings native spinners and a value the browser
  parses itself, neither of which survives a unit suffix. The ARIA value text
  is the formatted text even while the plain number is shown: it is the one
  that says what the value means. -->
<!-- The caller's attributes go first, so that the field's own state —
  disabled, readonly, the ARIA — cannot be overridden by them. -->
<input
  {...rest}
  bind:this={ref}
  type="text"
  inputmode="decimal"
  role="spinbutton"
  value={shown}
  disabled={field.disabled}
  readonly={field.readonly}
  aria-disabled={field.disabled}
  aria-readonly={field.readonly}
  aria-valuenow={field.value}
  aria-valuemin={field.min}
  aria-valuemax={field.max}
  aria-valuetext={field.text}
  step={field.step}
  data-disabled={field.disabled ? '' : undefined}
  data-readonly={field.readonly ? '' : undefined}
  data-out-of-range={field.outOfRange ? '' : undefined}
  oninput={(event) => {
    field.setDraft(event.currentTarget.value)
    oninput?.(event)
  }}
  onfocus={(event) => {
    focused = true
    select()
    onfocus?.(event)
  }}
  onblur={(event) => {
    focused = false
    // Nothing was typed, so there is no draft and this returns at once —
    // taking focus and leaving again never commits anything.
    field.commitDraft()
    onblur?.(event)
  }}
  onkeydown={(event) => {
    const key = event.key
    if (key === 'Enter') {
      field.commitDraft()
      if (field.blurOnEnter) event.currentTarget.blur()
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
    onkeydown?.(event)
  }}
/>
