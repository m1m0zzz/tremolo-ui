import { useState } from 'react'

import { Knob } from '../src/components/Knob'
import { Meta, StoryObj } from '@storybook/react'

import { inputEventOptionType, sizesOptionType } from './lib/typeUtils'

export default {
  title: 'React/Components/Knob',
  component: Knob,
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
  },
} satisfies Meta<typeof Knob>

type Story = StoryObj<typeof Knob>

export const Basic: Story = {
  args: {
    min: 0,
    max: 100,
    wheel: ['normalized', 0.05],
    keyboard: ['normalized', 0.05],
  },
  render: (args) => {
    const [value, setValue] = useState(10)

    return (
      <>
        <Knob {...args} value={value} onChange={(v) => setValue(v)} />
        <p>value: {value}</p>
      </>
    )
  },
}
