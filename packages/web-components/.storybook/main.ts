import type { StorybookConfig } from '@storybook/html-vite'

const config: StorybookConfig = {
  stories: [
    '../__stories__/**/*.mdx',
    '../__stories__/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
}
export default config
