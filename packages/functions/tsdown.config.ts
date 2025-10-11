import { defineConfig, UserConfig } from 'tsdown'

const commonConfig: UserConfig = {
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
}

export default defineConfig([
  {
    entry: {
      type: './src/components/NumberInput/type.ts',
    },
    outDir: 'dist/NumberInput',
    ...commonConfig,
  },
  {
    entry: {
      type: './src/components/Slider/type.ts',
    },
    outDir: 'dist/Slider',
    ...commonConfig,
  },
  {
    entry: './src/index.ts',
    ...commonConfig,
  },
])
