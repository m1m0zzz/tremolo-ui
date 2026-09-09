import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
      'compose-refs': './src/compose-refs/index.tsx',
    },
    format: ['esm', 'cjs'],
    platform: 'neutral',
    deps: {
      neverBundle: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    dts: true,
    sourcemap: true,
    css: {
      fileName: 'index.css',
    },
    publint: {
      level: 'error',
    },
    attw: {
      level: 'warn',
      // TODO: not woring
      excludeEntrypoints: ['**/*.css'],
    },
  },
])
