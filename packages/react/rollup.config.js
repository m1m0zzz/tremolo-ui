import path from 'path'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import copy from 'rollup-plugin-copy'
import del from 'rollup-plugin-delete'
import css from 'rollup-plugin-import-css'

import pkg from './package.json' assert { type: 'json' }

/**
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
        resolve(),
        css({
          output: 'styles/index.css',
        }),
        typescript({
          tsconfig: './tsconfig.json',
          outDir: `dist/${format}`,
          declarationDir: `dist/${format}/types`,
          rootDir: './src',
          exclude: ['**/__tests__/**', '**/__stories__/**'],
        }),
        copy({
          targets: [
            { src: 'dist/cjs/styles/*.css', dest: 'dist/styles' },
          ]
        }),
        del({
          targets: [
            'dist/tsconfig.tsbuildinfo',
            'dist/cjs/styles',
            'dist/esm/styles',
          ],
          hook: 'closeBundle'
        }),
      ],
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    }
  ]
}

export default [...getConfig('cjs'), ...getConfig('esm')]
