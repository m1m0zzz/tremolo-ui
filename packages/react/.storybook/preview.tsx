// @ts-ignore
import propTypes from 'virtual:tremolo-prop-types'

// https://storybook.js.org/docs/faq#extensionless-imports-in-storybook-main-config
import { propTypeEnhancers } from './argTypes.ts'

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
      // The background global holds the option's name, not its colour.
      const bg: string | undefined = context.globals.backgrounds?.value
      const html = document.documentElement
      if (bg === 'dark') {
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
