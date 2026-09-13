import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { NumberInput } from '.'

import numberInputTheme from 'shared/css/NumberInput.module.css'

export default {
  title: 'Components/NumberInput/IncrementStepper',
  component: NumberInput.IncrementStepper,
} satisfies Meta<typeof NumberInput.IncrementStepper>

type Story = StoryObj<typeof NumberInput.IncrementStepper>

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

/** Raises the value by one `step`, and keeps raising it while it is held. */
export const Basic: Story = {
  render: () => <Subject />,
}
