<script lang="ts">
  import { Slider } from '../../../src/index.js'

  import type { MarksOptions } from '@tremolo-ui/dom'
  import type { SliderProps } from '../../../src/index.js'

  type Props = Omit<SliderProps, 'children' | 'value' | 'min' | 'max'> & {
    value?: number
    marks?: MarksOptions
  }

  let { value = $bindable(50), marks, ...rest }: Props = $props()
</script>

<Slider.Root bind:value min={0} max={100} data-testid="root" {...rest}>
  <Slider.Track data-testid="track">
    <Slider.Thumb data-testid="thumb" aria-label="Level" />
  </Slider.Track>
  {#if marks}
    <Slider.Marks options={marks} data-testid="marks" />
  {/if}
</Slider.Root>
