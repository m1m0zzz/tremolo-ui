// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from 'node:module'
import { join, dirname, resolve } from 'path'

import { type InlineConfig, type UserConfig } from 'vite'

import { collectPropTypes, propTypesModule } from './propTypes'

import type { StorybookConfig } from '@storybook/react-vite'

const require = createRequire(import.meta.url)

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')))
}

/**
 * Serves the resolved prop types to `preview.tsx`, which prints them in the
 * Controls table. Resolving them needs the TypeScript compiler, so it happens
 * here rather than in the browser.
 */
function propTypesPlugin() {
  const moduleId = 'virtual:tremolo-prop-types'
  const resolvedId = '\0' + moduleId

  return {
    name: 'tremolo-prop-types',
    resolveId: (id: string) => (id === moduleId ? resolvedId : undefined),
    load(id: string) {
      if (id !== resolvedId) return
      return propTypesModule(
        collectPropTypes([
          resolve(import.meta.dirname, '../src/index.ts'),
          resolve(import.meta.dirname, '../../functions/src/index.ts'),
          resolve(import.meta.dirname, '../../dom/src/index.ts'),
        ]),
      )
    },
  }
}

const config: StorybookConfig = {
  stories: [
    '../**/__stories__/**/*.mdx',
    '../**/__stories__/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  staticDirs: ['../__stories__/public'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  async viteFinal(config) {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import('vite')

    return mergeConfig<InlineConfig, UserConfig>(config, {
      plugins: [propTypesPlugin()],
      server: {
        allowedHosts: ['.ngrok-free.dev'],
        hmr: {
          clientPort: process.env.CODESPACES ? 443 : undefined,
        },
      },
    })
  },
}

export default config
