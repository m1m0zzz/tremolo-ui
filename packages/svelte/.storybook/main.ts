import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import type { StorybookConfig } from '@storybook/svelte-vite'

const require = createRequire(import.meta.url)

/**
 * Where the built Storybook is served from. The Worker holding it answers the
 * route tremolo-ui.mimoz.dev/i/storybook-svelte*, and Workers Static Assets
 * match a request path against a file path, so the output has to sit under
 * the same prefix — see `build:sb` in package.json.
 */
export const STORYBOOK_BASE = '/i/storybook-svelte/'

/** Resolve a package's directory, which a monorepo needs for the addons. */
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  stories: ['../__stories__/**/*.stories.svelte'],
  addons: [
    getAbsolutePath('@storybook/addon-svelte-csf'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/svelte-vite'),
    options: {},
  },
  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import('vite')
    // Only the build gets the base: setting it in dev would move the local
    // URL off of / too.
    return mergeConfig(config, {
      ...(configType === 'PRODUCTION' && { base: STORYBOOK_BASE }),
    })
  },
}

export default config
