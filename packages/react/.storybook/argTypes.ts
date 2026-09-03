import type { Preview } from '@storybook/react-vite'
import type { StrictArgTypes } from 'storybook/internal/types'

/** The shape react-docgen records for a TypeScript type. */
type TSType = { name: string; raw?: string }

type WithDocgen = {
  __docgenInfo?: { props?: Record<string, { tsType?: TSType }> }
}

/**
 * react-docgen describes a union, tuple or intersection by its kind alone
 * (`{ name: 'union', raw: "'raw' | 'normalized'" }`), and Storybook prints
 * that kind verbatim, so the Controls table ends up saying just "union".
 *
 * Only `Array`, `Record` and `signature` are printed from `raw`, so anything
 * else whose summary still reads as the bare kind name is filled in from
 * `raw`, which holds the type as written. A multi-line one is collapsed for
 * the summary and kept whole as the detail, the way `lib/typeUtils` writes
 * them by hand.
 *
 * A summary set by the story itself is left alone.
 */
export function applyRawTypeSummaries(
  argTypes: StrictArgTypes,
  component: unknown,
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

      const multiline = raw.includes('\n')
      return [
        name,
        {
          ...argType,
          table: {
            ...argType.table,
            type: {
              ...argType.table?.type,
              summary: multiline ? raw.replace(/\s+/g, ' ') : raw,
              ...(multiline && { detail: raw }),
            },
          },
        },
      ]
    }),
  )
}

export const argTypesEnhancers: Preview['argTypesEnhancers'] = [
  (context) => applyRawTypeSummaries(context.argTypes, context.component),
]
