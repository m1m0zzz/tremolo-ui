<script lang="ts">
  import { cssLength } from '@tremolo-ui/dom'

  import { setPlacement } from '../_util/placement.js'

  import { useSliderContext } from './context.js'
  import type { SliderTrackProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = SliderTrackProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof SliderTrackProps>

  let {
    length,
    thickness,
    active,
    inactive,
    ref = $bindable(null),
    children,
    style,
    ...rest
  }: Props = $props()

  const slider = useSliderContext()
  setPlacement('Slider.Track')

  // The track is what the pointer position is normalized against.
  $effect(() => {
    slider.setTrack(ref)
    return () => slider.setTrack(null)
  })
</script>

<!-- `--percent` is where the value sits, for the theme to paint the fill
  with: the one number CSS cannot work out on its own. -->
<div
  bind:this={ref}
  data-disabled={slider.disabled ? '' : undefined}
  data-orientation={slider.vertical ? 'vertical' : 'horizontal'}
  data-flipped={slider.vertical !== slider.reverse ? '' : undefined}
  style="position: relative; {style ?? ''}"
  style:--active={active}
  style:--inactive={inactive}
  style:--length={cssLength(length)}
  style:--thickness={cssLength(thickness)}
  style:--percent="{slider.percent}%"
  {...rest}
>
  {@render children?.()}
</div>
