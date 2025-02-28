import type { Preview } from '@storybook/react'

import '../src/index' // import css without build

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|bg|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
