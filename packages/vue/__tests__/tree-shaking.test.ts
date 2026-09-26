// @vitest-environment node
// esbuild checks that TextEncoder returns a real Uint8Array, which jsdom's
// does not.
import { resolve } from 'node:path'

import { build } from 'esbuild'

/**
 * Bundle a single import from the built package — what an app consumes, and
 * what differs from the source: the build rewrites a spread into a helper
 * call — and list the components that came along. `@__PURE__` on `defineComponent(...)` only lets a bundler drop an
 * unused component while nothing in its arguments may have a side effect — a
 * spread, for one, may run a getter.
 */
async function componentsBundledWith(name: string) {
  const result = await build({
    stdin: {
      contents: `import { ${name} } from '@tremolo-ui/vue'; console.log(${name})`,
      resolveDir: resolve(import.meta.dirname, '..'),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    minify: true,
    external: ['vue', '@tremolo-ui/dom', '@tremolo-ui/functions'],
    logLevel: 'silent',
  })
  const code = result.outputFiles[0].text
  return [...code.matchAll(/name:"([A-Za-z]+)"/g)].map(([, found]) => found)
}

test('a composable brings no component with it', async () => {
  expect(await componentsBundledWith('useDrag')).toEqual([])
})

test.each(['Slider', 'NumberInput'])(
  'a component brings only itself: %s',
  async (name) => {
    expect(await componentsBundledWith(name)).toEqual([name])
  },
)
