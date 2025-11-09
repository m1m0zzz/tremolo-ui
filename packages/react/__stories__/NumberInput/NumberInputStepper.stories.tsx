import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { NumberInput } from '../../src/components/NumberInput'

export default {
  title: 'Components/NumberInput/Stepper',
  component: NumberInput.Stepper,
} satisfies Meta<typeof NumberInput.Stepper>

type Story = StoryObj<typeof NumberInput.Stepper>

export const Basic: Story = {
  render: (args) => {
    const [value, setValue] = useState(32)
    const [step, setStep] = useState(1)

    return (
      <div>
        <NumberInput
          value={value}
          step={step}
          min={0}
          max={10}
          units={'Hz'}
          keepWithinRange={false}
          onChange={(v) => setValue(v)}
        >
          <NumberInput.Stepper {...args}>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput>
        <p>config</p>
        <div>
          <span>step: </span>
          <NumberInput value={step} step={0.01} onChange={setStep} />
        </div>
      </div>
    )
  },
}
