<script lang="ts">
  import { NumberInput } from '@tremolo-ui/svelte'

  // Copy this file from the Styling page into your own project.
  import numberInputTheme from './NumberInput.module.css'

  let value = $state(64)
</script>

<NumberInput.Root class={numberInputTheme.root} bind:value min={0} max={100}>
  <NumberInput.InputField class={numberInputTheme.field} aria-label="Value" />
  <NumberInput.Stepper class={numberInputTheme.stepper}>
    <NumberInput.IncrementStepper class={numberInputTheme.incrementStepper} />
    <NumberInput.DecrementStepper class={numberInputTheme.decrementStepper} />
  </NumberInput.Stepper>
</NumberInput.Root>
