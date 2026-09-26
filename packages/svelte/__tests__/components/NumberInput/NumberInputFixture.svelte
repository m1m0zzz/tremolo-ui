<script lang="ts">
  import { NumberInput } from '../../../src/index.js'

  import type { NumberInputProps } from '../../../src/index.js'

  type Props = Omit<NumberInputProps, 'children' | 'value'> & {
    value?: number
    fieldProps?: Record<string, unknown>
  }

  let { value = $bindable(50), fieldProps = {}, ...rest }: Props = $props()
</script>

<NumberInput.Root bind:value data-testid="root" {...rest}>
  <NumberInput.InputField {...fieldProps} />
  <NumberInput.Stepper data-testid="stepper">
    <NumberInput.IncrementStepper />
    <NumberInput.DecrementStepper />
  </NumberInput.Stepper>
</NumberInput.Root>
