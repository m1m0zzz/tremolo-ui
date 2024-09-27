import { Meta } from '@storybook/html'

// import html from './tremolo-slider.html'

export default {
  title: 'Web Components/Components/Slider',
  tags: ['autodocs'],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render: (args) => `<tremolo-slider />`,
  // render: (args) => {
  //   return createComponent(args)
  // },
} as Meta

export const Basic = {
  args: {
    value: 32,
  },
}
