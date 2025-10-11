import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'neutral',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    dts: true,
    sourcemap: true,
  },
])
