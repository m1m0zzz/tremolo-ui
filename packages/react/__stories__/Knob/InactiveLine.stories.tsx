import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Knob } from '../../src/components/Knob'

export default {
  title: 'Components/Knob/InactiveLine',
  component: Knob.InactiveLine,
  argTypes: {
    stroke: {
      control: 'color',
    },
    strokeWidth: {
      type: 'number',
    },
  },
} satisfies Meta<typeof Knob.InactiveLine>

type Story = StoryObj<typeof Knob.InactiveLine>

export const Basic: Story = {
  args: {},
  render: (args) => {
    const [value, setValue] = useState(10)

    return (
      <>
        <Knob.Root
          value={value}
          min={0}
          max={100}
          size={50}
          onChange={(v) => setValue(v)}
        >
          <Knob.SVGRoot>
            <Knob.ActiveLine />
            <Knob.InactiveLine {...args} />
            <Knob.Thumb />
          </Knob.SVGRoot>
        </Knob.Root>
        <p>value: {value}</p>
      </>
    )
  },
}
