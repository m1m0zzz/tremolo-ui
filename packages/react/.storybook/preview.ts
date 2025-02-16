import type { Preview } from '@storybook/react'

import '../src/index' // import css without build

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
