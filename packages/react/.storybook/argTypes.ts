import type { Preview } from '@storybook/react-vite'
import type { StrictArgTypes } from 'storybook/internal/types'

/** The shape react-docgen records for a TypeScript type. */
type TSType = { name: string; raw?: string }

type WithDocgen = {
  __docgenInfo?: { props?: Record<string, { tsType?: TSType }> }
}

/** How many times an alias inside an expansion is itself expanded. */
const MAX_DEPTH = 3

/**
 * Put a type on one line for the summary, which is a single row in the table.
 *
 * `raw` is the source text, comments and all, and a line comment would
 * swallow the rest of the type once the line breaks are gone.
 */
function oneLine(type: string): string {
  return type
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Replace the aliases in a type with what they stand for.
 *
 * react-docgen records a type as it was written, so a prop typed
 * `InputEventOption | null` says only that. The names are resolved by the
 * TypeScript checker at build time; see `typeAliases.ts`.
 */
export function expandAliases(
  type: string,
  aliases: Record<string, string>,
): string {
  let expanded = type

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const next = expanded.replace(
      /\b[A-Z]\w*\b/g,
      // A name is left alone where it stands for itself, so that an alias
      // whose definition names itself cannot loop.
      (name) => (aliases[name] !== undefined ? aliases[name] : name),
    )
    if (next === expanded) break
    expanded = next
  }

  return expanded
}

/**
 * react-docgen describes a union, tuple or intersection by its kind alone
 * (`{ name: 'union', raw: "'raw' | 'normalized'" }`), and Storybook prints
 * that kind verbatim, so the Controls table ends up saying just "union".
 *
 * Only `Array`, `Record` and `signature` are printed from `raw`, so anything
 * else whose summary still reads as the bare kind name is filled in from
 * `raw`, which holds the type as written. The detail holds the same type with
 * its aliases resolved, which is what the summary cannot show.
 *
 * A summary set by the story itself is left alone.
 */
export function applyRawTypeSummaries(
  argTypes: StrictArgTypes,
  component: unknown,
  aliases: Record<string, string>,
): StrictArgTypes {
  const props = (component as WithDocgen | undefined)?.__docgenInfo?.props
  if (!props) return argTypes

  return Object.fromEntries(
    Object.entries(argTypes).map(([name, argType]) => {
      const tsType = props[name]?.tsType
      const raw = tsType?.raw
      if (!raw || argType.table?.type?.summary !== tsType?.name) {
        return [name, argType]
      }

      const expanded = expandAliases(raw, aliases)
      // A type written across several lines is collapsed for the summary,
      // which is a single line in the table, and kept whole for the detail.
      const detail = expanded !== raw || raw.includes('\n') ? expanded : null

      return [
        name,
        {
          ...argType,
          table: {
            ...argType.table,
            type: {
              ...argType.table?.type,
              summary: oneLine(raw),
              ...(detail !== null && { detail }),
            },
          },
        },
      ]
    }),
  )
}

/** @see applyRawTypeSummaries */
export function typeSummaryEnhancers(
  aliases: Record<string, string>,
): Preview['argTypesEnhancers'] {
  return [
    (context) =>
      applyRawTypeSummaries(context.argTypes, context.component, aliases),
  ]
}
