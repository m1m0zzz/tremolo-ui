import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Slider } from '.'

import sliderTheme from 'shared/css/Slider.module.css'

export default {
  title: 'Components/Slider/MarksOption',
  component: Slider.MarksOption,
} satisfies Meta<typeof Slider.MarksOption>

type Story = StoryObj<typeof Slider.MarksOption>

/**
 * One mark on the scale, placed by its `value` along the same curve the thumb
 * runs on. `mark` draws the line, `label` the text: `label={null}` leaves the
 * text out, and any other value — an empty string included — is drawn as it
 * is rather than falling back to the value.
 */
export const Basic: Story = {
  args: {
    value: 50,
    mark: true,
    label: 'half',
    length: 12,
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
          <Slider.Marks className={sliderTheme.marks}>
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              value={0}
            />
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              {...args}
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

/**
 * `classes` and `styles` reach the mark and the label separately, so one set
 * of options can be told from another without a wrapper.
 */
export const Emphasis: Story = {
  args: {
    value: 50,
    length: 16,
    thickness: 3,
    styles: {
      mark: { backgroundColor: '#e0699f' },
      label: { color: '#e0699f', fontWeight: 700 },
    },
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
          <Slider.Marks className={sliderTheme.marks}>
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              value={0}
            />
            <Slider.MarksOption
              className={sliderTheme.marksOption}
              classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
              {...args}
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
