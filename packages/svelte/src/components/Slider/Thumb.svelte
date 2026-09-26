<script lang="ts">
  import { checkPlacement } from '../_util/placement.js'
  import VisuallyHiddenRangeInput from '../_util/VisuallyHiddenRangeInput.svelte'

  import { useSliderContext } from './context.js'
  import type { SliderThumbProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = SliderThumbProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof SliderThumbProps>

  let {
    color,
    children,
    style,
    // Pulled out so that they land on the range input: the input is the
    // control and takes the focus, and a name on a plain div is ignored.
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-valuetext': ariaValuetext,
    ...rest
  }: Props = $props()

  const slider = useSliderContext()
  checkPlacement('Slider.Thumb', 'Slider.Track')

  let input: HTMLInputElement | null = $state(null)

  // Root focuses the thumb when a drag starts, wherever it was placed.
  $effect(() => {
    slider.setThumb(input)
    return () => slider.setThumb(null)
  })

  /** Move the focus to the thumb's input. */
  export function focus() {
    if (!slider.disabled) input?.focus()
  }

  /** Take the focus away from the thumb's input. */
  export function blur() {
    input?.blur()
  }
</script>

<!-- Placed by a percentage of the track, measured from its own centre;
  `--translate` is there for a thumb that should hang off its edge. Where it
  sits is the component's decision, so it comes after the caller's style. -->
<div
  data-disabled={slider.disabled ? '' : undefined}
  data-readonly={slider.readonly ? '' : undefined}
  {...rest}
  style="position: absolute; translate: var(--translate, -50% -50%); z-index: 100; {style ??
    ''}"
  style:--color={color}
  style:top={slider.vertical ? `${slider.percent}%` : '50%'}
  style:left={slider.vertical ? '50%' : `${slider.percent}%`}
>
  <VisuallyHiddenRangeInput
    bind:ref={input}
    value={slider.value}
    min={slider.min}
    max={slider.max}
    step={slider.step}
    disabled={slider.disabled}
    aria-readonly={slider.readonly}
    aria-orientation={slider.vertical ? 'vertical' : 'horizontal'}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
    aria-describedby={ariaDescribedby}
    aria-valuetext={ariaValuetext}
    oninput={(event) => {
      const target = event.currentTarget
      if (slider.readonly) {
        target.value = String(slider.value)
        return
      }
      slider.change(target.valueAsNumber)
    }}
  />
  {@render children?.()}
</div>
