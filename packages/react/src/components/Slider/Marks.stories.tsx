import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Slider } from '.'

import sliderTheme from 'shared/css/Slider.module.css'

export default {
  title: 'Components/Slider/Marks',
  component: Slider.Marks,
} satisfies Meta<typeof Slider.Marks>

type Story = StoryObj<typeof Slider.Marks>

/**
 * Given `options`, `Marks` fills itself in: one option every interval, or
 * every `step` of the slider with `'step'`. The object form turns the mark or
 * the label off for the whole set.
 */
export const FromOptions: Story = {
  args: {
    options: 25,
    gap: 4,
  },
  render: (args) => {
    const [value, setValue] = useState(40)

    return (
      <div style={{ padding: '0 1rem 2rem' }}>
        <Slider.Root
          className={sliderTheme.root}
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        >
          <Slider.Track className={sliderTheme.track}>
            <Slider.Thumb className={sliderTheme.thumb} aria-label="Level" />
          </Slider.Track>
          <Slider.Marks className={sliderTheme.marks} {...args} />
        </Slider.Root>
      </div>
    )
  },
}

/**
 * Without `options`, what is written inside is what is drawn — each one placed
 * by its own value, at whatever intervals the scale calls for.
 */
export const Written: Story = {
  args: {
    gap: 4,
  },
  render: (args) => {
    const [value, setValue] = useState(40)

    return (
      <div style={{ padding: '0 1rem 2rem' }}>
        <Slider.Root
          className={sliderTheme.root}
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        >
          <Slider.Track className={sliderTheme.track}>
            <Slider.Thumb className={sliderTheme.thumb} aria-label="Level" />
          </Slider.Track>
          <Slider.Marks className={sliderTheme.marks} {...args}>
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              value={0}
            />
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              value={30}
              label="mid"
            />
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              value={60}
              label={null}
            />
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              value={100}
            />
          </Slider.Marks>
        </Slider.Root>
      </div>
    )
  },
}
