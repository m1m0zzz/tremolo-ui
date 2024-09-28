import { Meta } from '@storybook/html'

import { createSlider } from './tremolo-slider'

export default {
  title: 'Web Components/Components/Slider',
  tags: ['autodocs'],
  render: (args) => createSlider(args),
  // render: (args) => {
  //   return createComponent(args)
  // },
} as Meta

export const Basic = {
  args: {
    value: 32,
    min: 0,
    max: 100,
    children: `bbb`,
  },
}
