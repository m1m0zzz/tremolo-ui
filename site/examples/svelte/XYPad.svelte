<script lang="ts">
  import { XYPad } from '@tremolo-ui/svelte'

  // Copy this file from the Styling page into your own project.
  import xyPadTheme from './XYPad.module.css'

  let value: [number, number] = $state([32, 56])
</script>

<XYPad.Root class={xyPadTheme.root} bind:value min={0} max={100}>
  <XYPad.Area class={xyPadTheme.area}>
    <XYPad.Thumb
      class={xyPadTheme.thumb}
      aria-label={['X position', 'Y position']}
    />
  </XYPad.Area>
</XYPad.Root>
<p>x: {value[0]}, y: {value[1]}</p>
