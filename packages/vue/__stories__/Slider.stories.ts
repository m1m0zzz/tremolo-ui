import { h } from 'vue'

import { Slider, SliderMarks, SliderThumb, SliderTrack } from '../src'

import { withModel } from './model'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import sliderTheme from 'shared/css/Slider.module.css'

const meta = {
  title: 'Components/Slider',
  component: Slider,
  args: { modelValue: 30, min: 0, max: 100 },
  argTypes: { modelValue: { control: false } },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

const track = () =>
  h(SliderTrack, { class: sliderTheme.track }, () =>
    h(SliderThumb, { class: sliderTheme.thumb, 'aria-label': 'Level' }),
  )

export const Basic: Story = {
  render: (args) =>
    withModel(Slider, { class: sliderTheme.root, ...args }, track),
}

export const Marks: Story = {
  args: { step: 5 },
  render: (args) =>
    withModel(Slider, { class: sliderTheme.root, ...args }, () => [
      track(),
      h(SliderMarks, { class: sliderTheme.marks, options: 25 }),
    ]),
}

export const Vertical: Story = {
  args: { vertical: true },
  render: (args) =>
    withModel(Slider, { class: sliderTheme.root, ...args }, track),
}
