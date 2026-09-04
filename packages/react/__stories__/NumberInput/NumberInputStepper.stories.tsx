import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { NumberInput } from '../../src/components/NumberInput'

export default {
  title: 'Components/NumberInput/Stepper',
  component: NumberInput.Stepper,
} satisfies Meta<typeof NumberInput.Stepper>

type Story = StoryObj<typeof NumberInput.Stepper>

/**
 * Clicking a stepper moves the value by one `step` and repeats while held.
 * Dragging the stepper area up and down moves it one `step` every `drag`
 * pixels, whether or not the input has a range.
 */
export const Basic: Story = {
  render: (args) => {
    const [value, setValue] = useState(5)
    const [step, setStep] = useState(1)

    return (
      <div>
        <NumberInput.Root
          value={value}
          step={step}
          min={0}
          max={10}
          units={'Hz'}
          onChange={(v) => setValue(v)}
        >
          <NumberInput.InputField />
          <NumberInput.Stepper {...args}>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
        <p>config</p>
        <div>
          <span>step: </span>
          <NumberInput.Root value={step} step={0.01} onChange={setStep}>
            <NumberInput.InputField />
          </NumberInput.Root>
        </div>
      </div>
    )
  },
}
