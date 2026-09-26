import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/index.ts',
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  publint: {
    level: 'error',
  },
  attw: {
    level: 'error',
  },
})
