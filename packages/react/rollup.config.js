import path from 'path'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

import pkg from './package.json' with { type: 'json' }

/**
 *
 * @param {'cjs' | 'esm'} format
 */
function getConfig(format) {
  const dir =
    format == 'cjs' ? path.dirname(pkg.main) : path.dirname(pkg.module)
  return [
    {
      input: 'src/index.ts',
      output: [
        {
          dir: dir,
          format: format,
          sourcemap: true,
        },
      ],
      plugins: [
        commonjs({
          include: ['node_modules/**'],
        }),
        typescript({
          tsconfig: './tsconfig.json',
          outDir: `dist/${format}`,
          declarationDir: `dist/${format}/types`,
          exclude: ['**/__tests__/**', '**/__stories__/**'],
        }),
      ],
      external: ['react', 'react-dom', '@emotion/react'],
    },
    {
      input: `dist/${format}/types/src/index.d.ts`,
      output: [{ file: `dist/${format}/index.d.ts`, format: format }],
      plugins: [dts()],
    },
  ]
}

export default [...getConfig('cjs'), ...getConfig('esm')]
