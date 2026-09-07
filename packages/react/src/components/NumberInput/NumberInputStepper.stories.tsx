import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { unitFormat } from '@tremolo-ui/functions'

import { NumberInput } from '.'

export default {
  title: 'Components/NumberInput/Stepper',
  component: NumberInput.Stepper,
} satisfies Meta<typeof NumberInput.Stepper>

/**
 * Typed against `Root`, not `Stepper`. `Stepper` itself only takes a class, a
 * style and its children — everything a stepper drag actually depends on
 * (`step`, `drag`, `dragSensitivity`, `pointerLock`) is set on `Root`, and
 * this is what puts those in Controls.
 */
type Story = StoryObj<typeof NumberInput.Root>

/**
 * Clicking a stepper moves the value by one `step` and repeats while held.
 * Dragging the stepper area up and down moves it one `step` every `drag`
 * pixels, whether or not the input has a range. Holding shift covers a tenth
 * of that, which is `dragSensitivity`.
 */
export const Basic: Story = {
  args: {
    min: 0,
    max: 10,
    step: 1,
    drag: 1,
    dragSensitivity: { default: 1, shift: 0.1 },
    pointerLock: false,
    ...unitFormat('Hz'),
  },
  render: (args) => {
    const [value, setValue] = useState(5)

    return (
      <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)}>
        <NumberInput.InputField />
        <NumberInput.Stepper>
          <NumberInput.IncrementStepper />
          <NumberInput.DecrementStepper />
        </NumberInput.Stepper>
      </NumberInput.Root>
    )
  },
}
