import { h } from 'vue'

import {
  NumberInput,
  NumberInputDecrementStepper,
  NumberInputField,
  NumberInputIncrementStepper,
  NumberInputStepper,
} from '../src'

import { withModel } from './model'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import numberInputTheme from 'shared/css/NumberInput.module.css'

const meta = {
  title: 'Components/NumberInput',
  component: NumberInput,
  args: { modelValue: 440, min: 20, max: 20000 },
  argTypes: {
    modelValue: { control: false },
    format: { control: false },
    parse: { control: false },
  },
} satisfies Meta<typeof NumberInput>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: (args) =>
    withModel(NumberInput, { class: numberInputTheme.root, ...args }, () => [
      h(NumberInputField, {
        class: numberInputTheme.field,
        'aria-label': 'Frequency',
      }),
      h(NumberInputStepper, { class: numberInputTheme.stepper }, () => [
        h(NumberInputIncrementStepper, {
          class: numberInputTheme.incrementStepper,
        }),
        h(NumberInputDecrementStepper, {
          class: numberInputTheme.decrementStepper,
        }),
      ]),
    ]),
}

/** The unit is dropped while the field has focus, and the number selected. */
export const Format: Story = {
  args: {
    format: (v: number) => `${v} Hz`,
    selectOnFocus: 'number',
    unformatOnFocus: true,
  },
  render: (args) =>
    withModel(NumberInput, { class: numberInputTheme.root, ...args }, () =>
      h(NumberInputField, {
        class: numberInputTheme.field,
        'aria-label': 'Frequency',
      }),
    ),
}
