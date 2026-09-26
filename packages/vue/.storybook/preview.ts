import type { Preview } from '@storybook/vue3-vite'

import './global.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|bg|color)$/i,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    // The demo theme reads `.dark` on <html>, as it does in the React
    // Storybook and on the documentation site.
    (story, context) => {
      const dark = context.globals.backgrounds?.value === '#333'
      document.documentElement.classList.toggle('dark', dark)
      return story()
    },
  ],
  initialGlobals: {
    backgrounds: { value: 'light' },
  },
}

export default preview
