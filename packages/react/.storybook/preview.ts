import type { Preview } from '@storybook/react'

import '../src/styles/index.css'
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
}

export default preview
