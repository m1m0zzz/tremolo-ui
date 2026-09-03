import type { Preview } from '@storybook/react-vite'
import type { StrictArgTypes } from 'storybook/internal/types'

/** The shape react-docgen records for a TypeScript type. */
type TSType = { name: string; raw?: string }

type WithDocgen = {
  __docgenInfo?: { props?: Record<string, { tsType?: TSType }> }
}

/** Prop name to the type the checker resolved, keyed by the component itself. */
export type PropTypes = Map<unknown, Record<string, string>>

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
 * Fill in the type of each prop in the Controls table.
 *
 * Two things are wrong without this. react-docgen describes a union, tuple or
 * intersection by its kind alone (`{ name: 'union', raw: "'a' | 'b'" }`) and
 * Storybook prints that kind verbatim, so the table says just "union"; and a
 * type written as an alias says no more than the alias name.
 *
 * The summary comes from `raw`, the type as it was written, and the detail
 * from `propTypes`, where the checker has resolved what the names stand for.
 * A summary set by the story itself is left alone.
 */
export function applyPropTypes(
  argTypes: StrictArgTypes,
  component: unknown,
  propTypes: PropTypes,
): StrictArgTypes {
  const props = (component as WithDocgen | undefined)?.__docgenInfo?.props
  if (!props) return argTypes

  const resolved = propTypes.get(component) ?? {}

  return Object.fromEntries(
    Object.entries(argTypes).map(([name, argType]) => {
      const tsType = props[name]?.tsType
      const written = argType.table?.type?.summary
      // The story set this one, or Storybook printed the type in full already.
      if (!tsType?.raw || written !== tsType.name) return [name, argType]

      const summary = oneLine(tsType.raw)
      const detail = resolved[name] !== summary ? resolved[name] : undefined

      return [
        name,
        {
          ...argType,
          table: {
            ...argType.table,
            type: {
              ...argType.table?.type,
              summary,
              ...(detail && { detail }),
            },
          },
        },
      ]
    }),
  )
}

/** @see applyPropTypes */
export function propTypeEnhancers(
  propTypes: PropTypes,
): Preview['argTypesEnhancers'] {
  return [
    (context) => applyPropTypes(context.argTypes, context.component, propTypes),
  ]
}
