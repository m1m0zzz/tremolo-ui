import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Knob } from '.'

import knobTheme from 'shared/css/Knob.module.css'

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
          className={knobTheme.root}
          value={value}
          min={0}
          max={100}
          size={50}
          onChange={(v) => setValue(v)}
        >
          <Knob.SVGRoot>
            <Knob.ActiveLine className={knobTheme.activeLine} />
            <Knob.InactiveLine className={knobTheme.inactiveLine} {...args} />
            <Knob.Thumb
              className={knobTheme.thumb}
              classes={{ thumbLine: knobTheme.thumbLine }}
            />
          </Knob.SVGRoot>
        </Knob.Root>
        <p>value: {value}</p>
      </>
    )
  },
}
