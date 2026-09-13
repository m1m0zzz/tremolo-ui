import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Knob } from '.'

import knobTheme from 'shared/css/Knob.module.css'

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
            <Knob.InactiveLine className={knobTheme.inactiveLine} />
            <Knob.Thumb
              className={knobTheme.thumb}
              classes={{ thumbLine: knobTheme.thumbLine }}
              {...args}
            />
          </Knob.SVGRoot>
        </Knob.Root>
        <p>value: {value}</p>
      </>
    )
  },
}
