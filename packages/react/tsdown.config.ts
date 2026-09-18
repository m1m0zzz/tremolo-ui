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
    publint: {
      level: 'error',
    },
    attw: {
      // Public subpaths rely on `exports`; legacy node10 module resolution is
      // outside the supported consumer configurations.
      //
      // Narrowing the profile also stops attw from checking node10 on the root
      // entry, so nothing here would catch the top-level `types` in
      // package.json being pointed elsewhere. It has to stay on `index.d.cts`:
      // a toolchain that ignores `exports` reads `main` for the runtime too,
      // and `main` is the CJS build. The other two packages run attw on the
      // default profile, which does cover node10.
      profile: 'node16',
      level: 'error',
    },
  },
])
