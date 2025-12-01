import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Knob } from '../../src/components/Knob'

export default {
  title: 'Components/Knob/ActiveLine',
  component: Knob.ActiveLine,
  argTypes: {
    stroke: {
      control: 'color',
    },
    strokeWidth: {
      type: 'number',
    },
  },
} satisfies Meta<typeof Knob.ActiveLine>

type Story = StoryObj<typeof Knob.ActiveLine>

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
            <Knob.ActiveLine {...args} />
            <Knob.InactiveLine />
            <Knob.Thumb />
          </Knob.SVGRoot>
        </Knob>
        <p>value: {value}</p>
      </>
    )
  },
}
