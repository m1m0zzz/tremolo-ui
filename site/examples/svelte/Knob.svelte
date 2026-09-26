<script lang="ts">
  import { Knob } from '@tremolo-ui/svelte'

  // Copy this file from the Styling page into your own project.
  import knobTheme from './Knob.module.css'

  let value = $state(64)
</script>

<Knob.Root
  class={knobTheme.root}
  aria-label="Level"
  bind:value
  min={0}
  max={100}
  size={50}
>
  <Knob.SVGRoot>
    <Knob.ActiveLine class={knobTheme.activeLine} />
    <Knob.InactiveLine class={knobTheme.inactiveLine} />
    <Knob.Thumb
      class={knobTheme.thumb}
      classes={{ thumbLine: knobTheme.thumbLine }}
    />
  </Knob.SVGRoot>
</Knob.Root>
{value}
