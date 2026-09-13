import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { NumberInput } from '.'

import numberInputTheme from 'shared/css/NumberInput.module.css'

export default {
  title: 'Components/NumberInput/DecrementStepper',
  component: NumberInput.DecrementStepper,
} satisfies Meta<typeof NumberInput.DecrementStepper>

type Story = StoryObj<typeof NumberInput.DecrementStepper>

function Subject() {
  const [value, setValue] = useState(5)

  return (
    <NumberInput.Root
      className={numberInputTheme.root}
      min={0}
      max={10}
      value={value}
      onChange={(v) => setValue(v)}
    >
      <NumberInput.InputField className={numberInputTheme.field} />
      <NumberInput.Stepper className={numberInputTheme.stepper}>
        <NumberInput.IncrementStepper
          className={numberInputTheme.incrementStepper}
        />
        <NumberInput.DecrementStepper
          className={numberInputTheme.decrementStepper}
        />
      </NumberInput.Stepper>
    </NumberInput.Root>
  )
}

/** Lowers the value by one `step`, and keeps lowering it while it is held. */
export const Basic: Story = {
  render: () => <Subject />,
}
