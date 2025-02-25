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

    return (
      <NumberInput value={value} onChange={(v) => setValue(v)}>
        <Stepper {...args}>
          <IncrementStepper />
          <DecrementStepper />
        </Stepper>
      </NumberInput>
    )
  },
}
