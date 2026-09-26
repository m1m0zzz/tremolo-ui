<script lang="ts">
  import { cssLength, sliderMarks } from '@tremolo-ui/dom'

  import { setPlacement } from '../_util/placement.js'

  import { useSliderContext } from './context.js'
  import MarksOption from './MarksOption.svelte'
  import type { SliderMarksProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = SliderMarksProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof SliderMarksProps>

  let { gap, options, children, style, ...rest }: Props = $props()

  const slider = useSliderContext()
  setPlacement('Slider.Marks')

  const marks = $derived.by(() => {
    if (!options) return []
    const list = sliderMarks(options, slider.min, slider.max, slider.step)
    // In the order they are on screen.
    return slider.vertical !== slider.reverse ? list.reverse() : list
  })
</script>

<!-- Each option inside is placed against this box. -->
<div
  data-orientation={slider.vertical ? 'vertical' : 'horizontal'}
  style="position: relative; {style ?? ''}"
  style:--gap={cssLength(gap)}
  {...rest}
>
  {#if options}
    {#each marks as { value, mark, label } (value)}
      <MarksOption {value} {mark} label={label ? undefined : null} />
    {/each}
  {:else}
    {@render children?.()}
  {/if}
</div>
