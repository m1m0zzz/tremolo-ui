import { h } from 'vue'

import {
  Knob,
  KnobActiveLine,
  KnobInactiveLine,
  KnobSVGRoot,
  KnobThumb,
} from '../src'

import { withModel } from './model'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import knobTheme from 'shared/css/Knob.module.css'

const meta = {
  title: 'Components/Knob',
  component: Knob,
  args: {
    modelValue: 10,
    min: 0,
    max: 100,
    size: 50,
    wheel: ['normalized', 0.05],
    keyboard: ['normalized', 0.05],
  },
  argTypes: { modelValue: { control: false } },
} satisfies Meta<typeof Knob>

export default meta
type Story = StoryObj<typeof meta>

const knob = () =>
  h(KnobSVGRoot, null, () => [
    h(KnobInactiveLine, { class: knobTheme.inactiveLine }),
    h(KnobActiveLine, { class: knobTheme.activeLine }),
    h(KnobThumb, {
      class: knobTheme.thumb,
      classes: { thumbLine: knobTheme.thumbLine },
    }),
  ])

export const Basic: Story = {
  render: (args) => withModel(Knob, { class: knobTheme.root, ...args }, knob),
}

/** The active arc grows from the middle, for a pan or a detune. */
export const Bipolar: Story = {
  args: { min: -50, max: 50, modelValue: 0, startValue: 0 },
  render: (args) => withModel(Knob, { class: knobTheme.root, ...args }, knob),
}
