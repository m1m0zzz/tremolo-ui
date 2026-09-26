<script lang="ts">
  import { Knob } from '../../../src/index.js'

  import type { KnobProps } from '../../../src/index.js'

  type Props = Omit<KnobProps, 'children' | 'value' | 'min' | 'max'> & {
    value?: number
    min?: number
    max?: number
    'data-testid'?: string
  }

  let { value = $bindable(50), min = 0, max = 100, ...rest }: Props = $props()
</script>

<Knob.Root bind:value {min} {max} data-testid="knob" {...rest}>
  <Knob.SVGRoot>
    <Knob.InactiveLine data-testid="inactive" />
    <Knob.ActiveLine data-testid="active" />
    <Knob.Thumb />
  </Knob.SVGRoot>
</Knob.Root>
