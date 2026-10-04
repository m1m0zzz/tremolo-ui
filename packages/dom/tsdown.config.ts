import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    internal: './src/internal.ts',
  },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  publint: {
    level: 'error',
  },
  attw: {
    // The `internal` subpath relies on `exports`, like `compose-refs` in
    // react: legacy node10 resolution is outside the supported setups. See
    // react's tsdown.config.ts for what narrowing the profile gives up.
    profile: 'node16',
    level: 'error',
  },
})
