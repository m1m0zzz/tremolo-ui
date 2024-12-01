import type { StorybookConfig } from '@storybook/react-vite'

import { join, dirname } from 'path'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  stories: [
    '../**/__stories__/**/*.mdx',
    '../**/__stories__/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  // staticDirs: ['../__stories__/assets'], TODO: doesn't working?
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  viteFinal: async (config) => {
		config.resolve!.alias = {
			...config.resolve?.alias,
			'functions': '@tremolo-ui/functions',
		}
		return config
	},
}
export default config
