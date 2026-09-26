<script lang="ts">
  import {
    commitNumberInputText,
    DEFAULT_DRAG_SENSITIVITY,
    DEFAULT_KEYBOARD_OPTIONS,
    DEFAULT_WHEEL_OPTIONS,
    numberInputBounds,
    numberInputRanges,
    nudgeNumberInput,
    parseLeadingNumber,
    wheelDirection,
  } from '@tremolo-ui/dom'
  import { linearScale } from '@tremolo-ui/functions'

  import { wheel as wheelAction } from '../../actions/wheel.js'
  import { useCheckSteps } from '../_util/check-steps.svelte.js'

  import { setNumberInputContext } from './context.js'
  import type { NumberInputProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = NumberInputProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof NumberInputProps>

  let {
    value = $bindable(),
    min,
    max,
    step = 1,
    scale = linearScale,
    format = String,
    parse = parseLeadingNumber,
    clampValue = true,
    wheel = DEFAULT_WHEEL_OPTIONS,
    keyboard = DEFAULT_KEYBOARD_OPTIONS,
    drag = 1,
    dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
    pointerLock = false,
    selectOnFocus = 'none',
    unformatOnFocus = false,
    keepCaretOnStep = false,
    blurOnEnter = true,
    disabled = false,
    readonly = false,
    onChange,
    ref = $bindable(null),
    children,
    ...rest
  }: Props = $props()

  /**
   * The text being typed. The only state here: it is not a copy of `value`,
   * but the half-finished entry that has no value to be derived from yet.
   */
  let draft: string | null = $state(null)
  let input: HTMLInputElement | null = null

  const inactive = $derived(disabled || readonly)
  const ranges = $derived(
    numberInputRanges({ min, max, step, scale, clampValue }),
  )
  const bounds = $derived(numberInputBounds(value, { min, max, clampValue }))
  const text = $derived(draft ?? format(value))

  // An open end has no travel to sample, so the check is skipped.
  useCheckSteps(() => ({
    component: 'NumberInput',
    range:
      min !== undefined && max !== undefined && min < max
        ? { min, max, step, scale }
        : null,
    keyboard,
    wheel,
    format,
  }))

  function changeValue(next: number) {
    if (inactive) return
    draft = null
    if (next === value) return
    value = next
    onChange?.(next)
  }

  setNumberInputContext({
    get value() {
      return value
    },
    get min() {
      return min
    },
    get max() {
      return max
    },
    get step() {
      return step
    },
    get disabled() {
      return disabled
    },
    get readonly() {
      return readonly
    },
    get keyboard() {
      return keyboard
    },
    get drag() {
      return drag
    },
    get dragSensitivity() {
      return dragSensitivity
    },
    get pointerLock() {
      return pointerLock
    },
    get selectOnFocus() {
      return selectOnFocus
    },
    get unformatOnFocus() {
      return unformatOnFocus
    },
    get keepCaretOnStep() {
      return keepCaretOnStep
    },
    get blurOnEnter() {
      return blurOnEnter
    },
    get text() {
      return text
    },
    get editing() {
      return draft !== null
    },
    get outOfRange() {
      return draft === null && bounds.outOfRange
    },
    get atMin() {
      return bounds.atMin
    },
    get atMax() {
      return bounds.atMax
    },
    get rawRange() {
      return ranges.raw
    },
    setDraft: (next) => {
      if (inactive) return
      draft = next
      // Deliberately unclamped: clamping here would make "1500" impossible
      // to type into an input whose max is 100.
      const parsed = parse(next)
      if (Number.isFinite(parsed)) {
        value = parsed
        onChange?.(parsed)
      }
    },
    commitDraft: () => {
      if (draft === null || inactive) return
      const committed = commitNumberInputText(draft, parse, {
        min,
        max,
        clampValue,
      })
      // Text with no number is not a value: the field goes back to what it
      // was showing.
      if (committed === null) draft = null
      else changeValue(committed)
    },
    changeValue,
    nudge: (direction, option, modifiers) =>
      changeValue(
        nudgeNumberInput(value, direction, option, ranges, modifiers),
      ),
    setInput: (element) => {
      input = element
    },
  })

  const wheelOptions = $derived({
    requireFocus: true,
    onWheel: (event: WheelEvent) => {
      const direction = wheelDirection(event)
      if (!wheel || inactive || direction === null) return
      event.preventDefault()
      changeValue(nudgeNumberInput(value, direction, wheel, ranges, event))
    },
  })

  /** Move the focus to the field. */
  export function focus() {
    if (!disabled) input?.focus()
  }

  /** Take the focus away from the field. */
  export function blur() {
    input?.blur()
  }
</script>

<div
  bind:this={ref}
  data-disabled={disabled ? '' : undefined}
  data-readonly={readonly ? '' : undefined}
  use:wheelAction={wheelOptions}
  {...rest}
>
  {@render children()}
</div>
