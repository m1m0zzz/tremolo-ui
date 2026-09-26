import type { Preview } from '@storybook/svelte-vite'

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
    (Story, context) => {
      // The background global holds the option's name, not its colour.
      const dark = context.globals.backgrounds?.value === 'dark'
      document.documentElement.classList.toggle('dark', dark)
      return Story()
    },
  ],
  initialGlobals: {
    backgrounds: { value: 'light' },
  },
}

export default preview
