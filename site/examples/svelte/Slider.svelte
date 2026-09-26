<script lang="ts">
  import { Slider } from '@tremolo-ui/svelte'

  // Copy this file from the Styling page into your own project.
  import sliderTheme from './Slider.module.css'

  let value = $state(64)
</script>

<Slider.Root class={sliderTheme.root} bind:value min={0} max={100}>
  <Slider.Track class={sliderTheme.track}>
    <Slider.Thumb class={sliderTheme.thumb} aria-label="Level" />
  </Slider.Track>
</Slider.Root>
<span>{value}</span>
