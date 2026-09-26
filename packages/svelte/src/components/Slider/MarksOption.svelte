<script lang="ts">
  import { cssLength, valuePercent } from '@tremolo-ui/dom'

  import { checkPlacement } from '../_util/placement.js'

  import { useSliderContext } from './context.js'
  import type { SliderMarksOptionProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = SliderMarksOptionProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof SliderMarksOptionProps>

  let {
    value,
    mark = true,
    label,
    thickness,
    length,
    gap,
    classes,
    styles,
    style,
    ...rest
  }: Props = $props()

  const slider = useSliderContext()
  checkPlacement('Slider.MarksOption', 'Slider.Marks')

  // The marks sit on the same curve the thumb runs along.
  const percent = $derived(
    valuePercent(
      value,
      { min: slider.min, max: slider.max, scale: slider.scale },
      slider.vertical !== slider.reverse,
    ),
  )
  const orientation = $derived(slider.vertical ? 'vertical' : 'horizontal')
</script>

<div
  data-orientation={orientation}
  {...rest}
  style="position: absolute; translate: {slider.vertical
    ? 'var(--translate, 0 -50%)'
    : 'var(--translate, -50% 0)'}; z-index: 10; {style ?? ''}"
  style:--thickness={cssLength(thickness)}
  style:--length={cssLength(length)}
  style:--gap={cssLength(gap)}
  style:left={slider.vertical ? undefined : `${percent}%`}
  style:top={slider.vertical ? `${percent}%` : undefined}
>
  {#if mark}
    <div
      class={classes?.mark}
      style={styles?.mark}
      data-orientation={orientation}
    ></div>
  {/if}
  {#if label !== null}
    <div class={classes?.label} style={styles?.label}>{label ?? value}</div>
  {/if}
</div>
