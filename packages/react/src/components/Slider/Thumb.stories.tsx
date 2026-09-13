import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Slider } from '.'

import sliderTheme from 'shared/css/Slider.module.css'

export default {
  title: 'Components/Slider/Thumb',
  component: Slider.Thumb,
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof Slider.Thumb>

type Story = StoryObj<typeof Slider.Thumb>

/**
 * The thumb carries the slider's semantics: the focus, the value and the
 * accessible name all live on the range input inside it, so `aria-label`
 * belongs here rather than on `Root`.
 */
export const Basic: Story = {
  args: {
    'aria-label': 'Level',
    color: '#4e76e5',
  },
  render: (args) => {
    const [value, setValue] = useState(40)

    return (
      <>
        <Slider.Root
          className={sliderTheme.root}
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        >
          <Slider.Track className={sliderTheme.track}>
            <Slider.Thumb className={sliderTheme.thumb} {...args} />
          </Slider.Track>
        </Slider.Root>
        <p>value: {value}</p>
      </>
    )
  },
}

/**
 * The thumb is one element either way: children are drawn inside it rather
 * than in place of it, so its own look still comes from `className`, `style`
 * and `color`.
 */
export const WithChildren: Story = {
  args: {
    'aria-label': 'Level',
    children: '▲',
    style: { display: 'grid', placeItems: 'center', fontSize: 10 },
  },
  render: (args) => {
    const [value, setValue] = useState(40)

    return (
      <Slider.Root
        className={sliderTheme.root}
        value={value}
        min={0}
        max={100}
        onChange={setValue}
      >
        <Slider.Track className={sliderTheme.track}>
          <Slider.Thumb className={sliderTheme.thumb} {...args} />
        </Slider.Track>
      </Slider.Root>
    )
  },
}
