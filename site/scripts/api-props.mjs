// @ts-check
/**
 * Read the props of every part out of `@tremolo-ui/react`, so a component page
 * can list them without restating a type, a default or a description that the
 * source already has.
 *
 * The typedoc plugin converts the same entry point, but it only writes
 * Markdown pages. This runs its own conversion, which also keeps the tables
 * there under `SKIP_API`.
 *
 * The descriptions are JSDoc, so they are in English. The Japanese ones live
 * in `i18n/ja/api-props.json`, each stamped with a hash of the English it was
 * translated from. When the English changes the translation is stale, and the
 * page falls back to the English rather than showing something that no longer
 * says the same thing.
 *
 *   node scripts/api-props.mjs          generate, and report what is missing
 *   node scripts/api-props.mjs --stamp  also record the hash on translations
 *                                       that do not have one yet
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import MarkdownIt from 'markdown-it'
import { Application, ReflectionKind } from 'typedoc'

const siteDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const repoDir = path.dirname(siteDir)
const outFile = path.join(
  siteDir,
  'src',
  'components',
  'ApiReference',
  'props.generated.json',
)
const translationsFile = path.join(siteDir, 'i18n', 'ja', 'api-props.json')
const stamp = process.argv.includes('--stamp')

const app = await Application.bootstrapWithPlugins({
  entryPoints: [path.join(repoDir, 'packages/react/src/index.ts')],
  tsconfig: path.join(repoDir, 'packages/react/tsconfig.json'),
  // The order they are declared in is the order they matter in: `value`,
  // `min` and `max` come first. Alphabetical would put `children` on top.
  sort: ['source-order'],
  logLevel: 'Warn',
})
const project = await app.convert()
if (!project) throw new Error('api-props: typedoc could not convert the source')

const md = new MarkdownIt()

/**
 * @param {readonly import('typedoc').CommentDisplayPart[]} parts
 */
function toMarkdown(parts) {
  return parts
    .map((part) => {
      if (part.kind !== 'inline-tag') return part.text
      // `{@link PianoProps.whiteKeyWidth}` reads as the name it points at.
      const target = part.target
      const name =
        target && typeof target === 'object' && 'name' in target
          ? target.name
          : part.text
      return `\`${name.trim()}\``
    })
    .join('')
    .trim()
}

/** @param {string} source */
function hash(source) {
  return createHash('sha1').update(source).digest('hex').slice(0, 8)
}

/**
 * What every element takes anyway. `children` and `aria-*` are kept when they
 * are documented, since that is where a part says what goes inside it, or that
 * a label is per axis.
 *
 * @param {import('typedoc').DeclarationReflection} prop
 */
function isElementAttribute(prop) {
  if (prop.name === 'className' || prop.name === 'style') return true
  if (prop.name !== 'children' && !prop.name.startsWith('aria-')) return false
  return !prop.comment?.summary.length
}

/** @type {Record<string, { message: string, source?: string }>} */
const translations = JSON.parse(await readFile(translationsFile, 'utf8'))
const used = new Set()
const missing = []
const stale = []
const unstamped = []

/** @param {string} key @param {string} english */
function japanese(key, english) {
  const entry = translations[key]
  used.add(key)
  if (!entry) {
    missing.push(key)
    return null
  }
  const source = hash(english)
  if (entry.source === undefined) {
    if (stamp) entry.source = source
    else unstamped.push(key)
  } else if (entry.source !== source) {
    stale.push(key)
    return null
  }
  return md.render(entry.message)
}

const output = {}

for (const reflection of project.getReflectionsByKind(
  ReflectionKind.Interface | ReflectionKind.TypeAlias,
)) {
  if (!reflection.name.endsWith('Props')) continue
  const props = reflection.children ?? []
  if (props.length === 0) continue

  output[reflection.name] = {
    kind: reflection.kindOf(ReflectionKind.Interface) ? 'interfaces' : 'types',
    props: props
      .filter((prop) => !isElementAttribute(prop))
      .map((prop) => {
        const comment = prop.comment ?? prop.signatures?.[0]?.comment
        const english = toMarkdown(comment?.summary ?? [])
        const defaultTag = comment?.getTag('@default')
        const key = `${reflection.name}.${prop.name}`
        return {
          name: prop.name,
          required: !prop.flags.isOptional,
          type: String(prop.type ?? prop.signatures?.[0]?.type ?? 'unknown'),
          default: defaultTag
            ? toMarkdown(defaultTag.content)
                .replace(/^```\w*\n?|\n?```$/g, '')
                .trim()
            : null,
          description: english
            ? { en: md.render(english), ja: japanese(key, english) }
            : null,
        }
      }),
  }
}

await mkdir(path.dirname(outFile), { recursive: true })
await writeFile(outFile, `${JSON.stringify(output, null, 2)}\n`)
console.log(`api-props: ${Object.keys(output).length} props types`)

const orphaned = Object.keys(translations).filter((key) => !used.has(key))
for (const [label, keys] of [
  ['no Japanese translation, showing English', missing],
  ['stale Japanese translation, showing English', stale],
  ['Japanese translation without a source hash (run with --stamp)', unstamped],
  ['translation for a prop that no longer exists', orphaned],
]) {
  if (keys.length > 0) {
    console.warn(`api-props: ${keys.length} ${label}\n  ${keys.join('\n  ')}`)
  }
}

if (stamp) {
  await writeFile(
    translationsFile,
    `${JSON.stringify(translations, null, 2)}\n`,
  )
}
