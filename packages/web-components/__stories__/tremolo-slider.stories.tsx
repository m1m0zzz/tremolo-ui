import { Meta, StoryObj } from '@storybook/html'

import { createSlider, SliderProps } from './tremolo-slider'

export default {
  title: 'Web Components/Components/Slider',
  tags: ['autodocs'],
  render: (args) => createSlider(args),
  argTypes: {
    value: {
      description: 'value desu',
      type: {
        name: 'number',
        required: true,
      },
    },
    min: {
      type: {
        name: 'number',
        required: true,
      },
    },
    max: {
      type: {
        name: 'number',
        required: true,
      },
    },
    step: {
      type: 'number',
      table: {
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    skew: { type: 'number' },
    length: { type: 'string' },
    direction: {
      control: 'select',
      options: ['right', 'left', 'up', 'down'],
      table: {
        defaultValue: { summary: 'right' },
        type: { summary: 'string' },
      },
    },
    enableWheel: {
      control: 'object',
    },
    children: {
      type: 'string',
    },
  },
} satisfies Meta<SliderProps>

type Story = StoryObj<SliderProps>

export const Basic: Story = {
  args: {
    value: 32,
    min: 0,
    max: 100,
  },
}

export const Direction: Story = {
  args: {
    value: 32,
    min: 0,
    max: 100,
    direction: 'down',
    enableWheel: ['normalized', 0.1],
  },
}
