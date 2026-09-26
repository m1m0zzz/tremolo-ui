<script lang="ts">
  import { XYPad } from '../../../src/index.js'

  import type { XY } from '@tremolo-ui/dom'
  import type { XYPadProps } from '../../../src/index.js'

  type Props = Omit<XYPadProps, 'children' | 'value' | 'min' | 'max'> & {
    value?: XY<number>
  }

  let { value = $bindable([50, 50]), ...rest }: Props = $props()
</script>

<XYPad.Root bind:value min={0} max={100} data-testid="root" {...rest}>
  <XYPad.Area data-testid="area">
    <XYPad.Thumb data-testid="thumb" aria-label={['Cutoff', 'Resonance']} />
  </XYPad.Area>
</XYPad.Root>
