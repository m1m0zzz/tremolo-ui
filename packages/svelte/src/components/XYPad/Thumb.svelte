<script lang="ts">
  import { toXY } from '@tremolo-ui/dom'

  import { checkPlacement } from '../_util/placement.js'
  import VisuallyHiddenRangeInput from '../_util/VisuallyHiddenRangeInput.svelte'

  import { useXYPadContext } from './context.js'
  import type { XYPadThumbProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = XYPadThumbProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof XYPadThumbProps>

  let {
    color,
    children,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-valuetext': ariaValuetext,
    ...rest
  }: Props = $props()

  const pad = useXYPadContext()
  checkPlacement('XYPad.Thumb', 'XYPad.Area')

  // Per axis, since the thumb holds one input for each.
  const labels = $derived(toXY(ariaLabel))
  const labelledby = $derived(toXY(ariaLabelledby))
  const describedby = $derived(toXY(ariaDescribedby))
  const valueText = $derived(toXY(ariaValuetext))

  let x: HTMLInputElement | null = $state(null)
  let y: HTMLInputElement | null = $state(null)

  // Root focuses the thumb when a drag starts, wherever it was placed.
  $effect(() => {
    pad.setThumb(x)
    return () => pad.setThumb(null)
  })

  function onInput(axis: 0 | 1, target: HTMLInputElement) {
    if (pad.readonly) {
      target.value = String(pad.value[axis])
      return
    }
    const next = [...pad.value] as [number, number]
    next[axis] = target.valueAsNumber
    pad.change(next)
  }

  /** Move the focus to the x input. */
  export function focus() {
    if (!pad.disabled) x?.focus()
  }

  /** Take the focus away from both inputs. */
  export function blur() {
    x?.blur()
    y?.blur()
  }
</script>

<div
  data-disabled={pad.disabled ? '' : undefined}
  data-readonly={pad.readonly ? '' : undefined}
  {...rest}
  style="position: absolute; translate: var(--translate, -50% -50%); z-index: 100; {style ??
    ''}"
  style:--color={color}
  style:left="{pad.percent[0]}%"
  style:top="{pad.percent[1]}%"
>
  <VisuallyHiddenRangeInput
    bind:ref={x}
    data-axis="x"
    value={pad.value[0]}
    min={pad.min[0]}
    max={pad.max[0]}
    step={pad.step[0]}
    disabled={pad.disabled}
    aria-readonly={pad.readonly}
    aria-orientation="horizontal"
    aria-label={labels[0] ?? 'x'}
    aria-labelledby={labelledby[0]}
    aria-describedby={describedby[0]}
    aria-valuetext={valueText[0]}
    oninput={(event) => onInput(0, event.currentTarget)}
  />
  <VisuallyHiddenRangeInput
    bind:ref={y}
    data-axis="y"
    value={pad.value[1]}
    min={pad.min[1]}
    max={pad.max[1]}
    step={pad.step[1]}
    disabled={pad.disabled}
    aria-readonly={pad.readonly}
    aria-orientation="vertical"
    aria-label={labels[1] ?? 'y'}
    aria-labelledby={labelledby[1]}
    aria-describedby={describedby[1]}
    aria-valuetext={valueText[1]}
    oninput={(event) => onInput(1, event.currentTarget)}
  />
  {@render children?.()}
</div>
