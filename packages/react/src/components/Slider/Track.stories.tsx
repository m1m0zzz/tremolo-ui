import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Slider } from '.'

export default {
  title: 'Components/Slider/Track',
  component: Slider.Track,
} satisfies Meta<typeof Slider.Track>

type Story = StoryObj<typeof Slider.Track>

/**
 * The track is the line the thumb runs along, and the one part that knows how
 * long the slider is. Every prop here writes a custom property the theme
 * reads, so leaving one out keeps whatever the theme decided.
 */
export const Basic: Story = {
  args: {
    length: 200,
    thickness: 10,
  },
  render: (args) => {
    const [value, setValue] = useState(40)

    return (
      <>
        <Slider.Root value={value} min={0} max={100} onChange={setValue}>
          <Slider.Track {...args}>
            <Slider.Thumb aria-label="Level" />
          </Slider.Track>
        </Slider.Root>
        <p>value: {value}</p>
      </>
    )
  },
}

/**
 * `active` and `inactive` are the two sides of the value. The fill itself is
 * drawn by the theme, from the `--percent` the track publishes — the package
 * paints nothing.
 */
export const Colors: Story = {
  args: {
    length: 200,
    thickness: 14,
    active: '#e0699f',
    inactive: '#f3d9e6',
  },
  render: (args) => {
    const [value, setValue] = useState(70)

    return (
      <Slider.Root value={value} min={0} max={100} onChange={setValue}>
        <Slider.Track {...args}>
          <Slider.Thumb aria-label="Level" color="#e0699f" />
        </Slider.Track>
      </Slider.Root>
    )
  },
}
