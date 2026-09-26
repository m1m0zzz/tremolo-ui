<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'

  import { NumberInput } from '../src/index.js'

  import numberInputTheme from 'shared/css/NumberInput.module.css'

  const { Story } = defineMeta({
    title: 'Components/NumberInput',
    component: NumberInput.Root,
    args: { value: 440, min: 20, max: 20000 },
    argTypes: {
      value: { control: false },
      children: { control: false },
      format: { control: false },
      parse: { control: false },
    },
  })
</script>

<Story name="Basic">
  {#snippet template({ children: _children, ...args })}
    <NumberInput.Root class={numberInputTheme.root} {...args}>
      <NumberInput.InputField
        class={numberInputTheme.field}
        aria-label="Frequency"
      />
      <NumberInput.Stepper class={numberInputTheme.stepper}>
        <NumberInput.IncrementStepper
          class={numberInputTheme.incrementStepper}
        />
        <NumberInput.DecrementStepper
          class={numberInputTheme.decrementStepper}
        />
      </NumberInput.Stepper>
    </NumberInput.Root>
  {/snippet}
</Story>

<Story
  name="Format"
  args={{
    format: (v: number) => `${v} Hz`,
    selectOnFocus: 'number',
    unformatOnFocus: true,
  }}
>
  {#snippet template({ children: _children, ...args })}
    <NumberInput.Root class={numberInputTheme.root} {...args}>
      <NumberInput.InputField
        class={numberInputTheme.field}
        aria-label="Frequency"
      />
    </NumberInput.Root>
  {/snippet}
</Story>
