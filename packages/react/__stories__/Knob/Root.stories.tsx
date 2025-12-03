import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Knob } from '../../src/components/Knob'
import { inputEventOptionType } from '../lib/typeUtils'

export default {
  title: 'Components/Knob/Root',
  component: Knob.Root,
  argTypes: {
    value: {
      control: false,
    },
    wheel: {
      table: {
        type: inputEventOptionType,
      },
    },
    keyboard: {
      table: {
        type: inputEventOptionType,
      },
    },
    children: {
      control: false,
    },
  },
} satisfies Meta<typeof Knob.Root>

type Story = StoryObj<typeof Knob.Root>

export const Basic: Story = {
  args: {
    min: 0,
    max: 100,
    size: 50,
    wheel: ['normalized', 0.05],
    keyboard: ['normalized', 0.05],
  },
  render: (args) => {
    const [value, setValue] = useState(10)

    return (
      <>
        <Knob.Root {...args} value={value} onChange={(v) => setValue(v)} />
        <p>value: {value}</p>
      </>
    )
  },
}
