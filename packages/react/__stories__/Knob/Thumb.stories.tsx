import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Knob } from '../../src/components/Knob'

export default {
  title: 'Components/Knob/Thumb',
  component: Knob.Thumb,
  argTypes: {
    thumb: {
      control: 'color',
    },
    thumbLine: {
      control: 'color',
    },
  },
} satisfies Meta<typeof Knob.Thumb>

type Story = StoryObj<typeof Knob.Thumb>

export const Basic: Story = {
  args: {},
  render: (args) => {
    const [value, setValue] = useState(10)

    return (
      <>
        <Knob
          value={value}
          min={0}
          max={100}
          size={50}
          onChange={(v) => setValue(v)}
        >
          <Knob.SVGRoot>
            <Knob.ActiveLine />
            <Knob.InactiveLine />
            <Knob.Thumb {...args} />
          </Knob.SVGRoot>
        </Knob>
        <p>value: {value}</p>
      </>
    )
  },
}
