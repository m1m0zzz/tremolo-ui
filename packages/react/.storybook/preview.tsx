import type { Preview } from '@storybook/react'

// storybook css
import './global.css'

// tremolo-ui css
import '../src/styles/global.css'
import '../src/components/Knob/index.css'
import '../src/components/NumberInput/index.css'
import '../src/components/Piano/index.css'
import '../src/components/Slider/index.css'
import '../src/components/XYPad/index.css'

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
  decorators: [
    (Story, context) => {
      const bg: string | undefined = context.globals.backgrounds?.value
      const dark = '#333'
      // const light = '#F8F8F8'
      const html = document.documentElement
      if (bg == dark) {
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
