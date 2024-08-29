import type { StorybookConfig } from '@storybook/react-vite';
import path from "path"

const config: StorybookConfig = {
  stories: [
    '../__stories__/**/*.mdx',
    '../__stories__/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  // staticDirs: ['../__stories__/assets'], TODO: doesn't working?
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
		config.resolve!.alias = {
			...config.resolve!.alias,
			'@': path.resolve(__dirname, '../src'),
		}
		return config
	},
};
export default config;
