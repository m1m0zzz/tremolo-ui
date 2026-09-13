// @ts-ignore
import propTypes from 'virtual:tremolo-prop-types'

import { propTypeEnhancers } from './argTypes'

import type { Preview } from '@storybook/react-vite'

// storybook css
// @ts-ignore
import './global.css'

const preview: Preview = {
  argTypesEnhancers: propTypeEnhancers(propTypes),
  parameters: {
    controls: {
      matchers: {
        color: /(background|bg|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const bg: string | undefined = context.globals.backgrounds?.value
      const dark = '#333'
      // const light = '#F8F8F8'
      const html = document.documentElement
      if (bg === dark) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
      return <Story />
    },
  ],
  initialGlobals: {
    backgrounds: { value: 'light' },
  },
}

export default preview
