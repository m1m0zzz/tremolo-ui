import path from 'path'
import typescript from '@rollup/plugin-typescript'
import del from 'rollup-plugin-delete'

/**
 * @param {string} entry
 */
function originName(entry) {
  return path.basename(entry).replace(path.extname(entry), '')
}

/**
 *
 * @param {'cjs' | 'esm'} format
 * @param {string} entry
 * @param {string | undefined} outDir
 */
function getConfig(format, entry) {
  const outDir = path.dirname(entry)
  return [
    {
      input: 'src/' + entry,
      output: [
        {
          dir: `dist/${format}/${outDir}`,
          format: format,
          sourcemap: true,
        },
      ],
      plugins: [
        typescript({
          tsconfig: './tsconfig.json',
          outDir: `dist/${format}/${outDir}`,
          declarationDir: `dist/${format}/${outDir}/types`,
          rootDir: './src',
          exclude: ['**/__tests__/**'],
        }),
        del({
          targets: [
            'dist/**/tsconfig.tsbuildinfo',
            'dist/**/components/tsconfig.tsbuildinfo',
          ],
          hook: 'buildEnd',
        }),
      ],
    },
  ]
}

export default [
  ...['index.ts', 'components/NumberInput/type.ts', 'components/Slider/type.ts']
    .map((entry) => {
      // const outDir = entry.match(/^components\/(.+)\//)?.[1]
      return [getConfig('cjs', entry), getConfig('esm', entry)]
    })
    .flat(2),
]
