import { h } from 'vue'

import { XYPad, XYPadArea, XYPadThumb } from '../src'

import { withModel } from './model'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import xyPadTheme from 'shared/css/XYPad.module.css'

const meta = {
  title: 'Components/XYPad',
  component: XYPad,
  args: { modelValue: [30, 60], min: 0, max: 100 },
  argTypes: { modelValue: { control: false } },
} satisfies Meta<typeof XYPad>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: (args) =>
    withModel(XYPad, { class: xyPadTheme.root, ...args }, () =>
      h(XYPadArea, { class: xyPadTheme.area }, () =>
        h(XYPadThumb, {
          class: xyPadTheme.thumb,
          ariaLabel: ['Cutoff', 'Resonance'],
        }),
      ),
    ),
}
