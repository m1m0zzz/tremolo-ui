import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  DecrementStepper,
  IncrementStepper,
  NumberInput,
  Stepper,
} from '../../src/components/NumberInput'

export default {
  title: 'Components/NumberInput/Stepper',
  component: Stepper,
} satisfies Meta<typeof Stepper>

type Story = StoryObj<typeof Stepper>

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
          // keepWithinRange={false}
          onChange={(v) => setValue(v)}
        >
          <Stepper {...args}>
            <IncrementStepper />
            <DecrementStepper />
          </Stepper>
        </NumberInput>
        <p>config</p>
        <div>
          <span>step: </span>
          <NumberInput value={step} onChange={(v) => setStep(v)} />
        </div>
      </div>
    )
  },
}
