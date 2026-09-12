import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { NumberInput } from '.'

export default {
  title: 'Components/NumberInput/IncrementStepper',
  component: NumberInput.IncrementStepper,
} satisfies Meta<typeof NumberInput.IncrementStepper>

type Story = StoryObj<typeof NumberInput.IncrementStepper>

function Subject({ children }: { children?: React.ReactNode }) {
  const [value, setValue] = useState(5)

  return (
    <NumberInput.Root
      min={0}
      max={10}
      value={value}
      onChange={(v) => setValue(v)}
    >
      <NumberInput.InputField />
      <NumberInput.Stepper>
        <NumberInput.IncrementStepper>{children}</NumberInput.IncrementStepper>
        <NumberInput.DecrementStepper />
      </NumberInput.Stepper>
    </NumberInput.Root>
  )
}

/** Raises the value by one `step`, and keeps raising it while it is held. */
export const Basic: Story = {
  render: () => <Subject />,
}

/**
 * The arrow is what the component draws when nothing is passed. Children
 * replace it, and `--stepper-icon-size` is what sizes it in the theme.
 */
export const CustomIcon: Story = {
  args: {
    children: '+',
  },
  render: ({ children }) => <Subject>{children}</Subject>,
}
