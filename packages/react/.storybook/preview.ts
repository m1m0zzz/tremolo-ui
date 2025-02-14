import type { Preview } from '@storybook/react'

import '../src/styles/index.css'
import '../src/components/NumberInput/index.css'
import '../src/components/Piano/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      // exclude: ['value', 'children'],
      matchers: {
        color: /(background|bg|color)$/i,
        date: /Date$/i,
      },
    },
    actions: {
      argTypesRegex: '^on[A-Z].*' // TODO: is not working?
    },
  },
  tags: ['autodocs'],
}

export default preview
