// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from 'node:module'
import { join, dirname, resolve } from 'path'

import { type InlineConfig, type UserConfig } from 'vite'

import { collectPropTypes, propTypesModule } from './propTypes'

import type { StorybookConfig } from '@storybook/react-vite'

const require = createRequire(import.meta.url)

/**
 * Where the built Storybook is served from. The Worker holding it answers the
 * route tremolo-ui.mimoz.dev/i/storybook-react*, and Workers Static Assets match
 * a request path against a file path, so the output has to sit under the same
 * prefix — see `build:sb` in package.json.
 */
export const STORYBOOK_BASE = '/i/storybook-react/'

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
    // A component's own stories sit next to it. What is left in __stories__
    // spans several components, or is shared by them.
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
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
  async viteFinal(config, { configType }) {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import('vite')

    return mergeConfig<InlineConfig, UserConfig>(config, {
      // In production the build is served from a sub-path of the docs domain
      // (tremolo-ui.mimoz.dev/i/storybook-react). Only the build gets the base:
      // setting it in dev would move the local URL off of / too.
      ...(configType === 'PRODUCTION' && { base: STORYBOOK_BASE }),
      plugins: [propTypesPlugin()],
      server: {
        hmr: {
          clientPort: process.env.CODESPACES ? 443 : undefined,
        },
      },
    })
  },
}

export default config
