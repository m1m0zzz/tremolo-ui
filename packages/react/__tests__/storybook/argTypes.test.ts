import { applyPropTypes, type PropTypes } from '../../.storybook/argTypes'

import type { StrictArgTypes } from 'storybook/internal/types'

/** What Storybook derives from react-docgen before the enhancer runs. */
function argTypes(summaries: Record<string, string>): StrictArgTypes {
  return Object.fromEntries(
    Object.entries(summaries).map(([name, summary]) => [
      name,
      { name, table: { type: { summary } } },
    ]),
  ) as StrictArgTypes
}

function component(props: Record<string, { name: string; raw?: string }>) {
  return {
    __docgenInfo: {
      props: Object.fromEntries(
        Object.entries(props).map(([name, tsType]) => [name, { tsType }]),
      ),
    },
  }
}

/** The map the Storybook build hands over, keyed by the component itself. */
function propTypes(
  subject: unknown,
  resolved: Record<string, string> = {},
): PropTypes {
  return new Map([[subject, resolved]])
}

describe('applyPropTypes', () => {
  test('replaces a bare kind name with the type as written', () => {
    const subject = component({
      wheel: { name: 'union', raw: 'InputEventOption | null' },
    })
    const result = applyPropTypes(
      argTypes({ wheel: 'union' }),
      subject,
      propTypes(subject),
    )

    expect(result.wheel.table?.type?.summary).toBe('InputEventOption | null')
  })

  test('puts the resolved type in the detail', () => {
    const subject = component({
      wheel: { name: 'union', raw: 'InputEventOption | null' },
    })
    const result = applyPropTypes(
      argTypes({ wheel: 'union' }),
      subject,
      propTypes(subject, {
        wheel: 'null | ["raw" | "normalized", number]',
      }),
    )

    expect(result.wheel.table?.type).toEqual({
      summary: 'InputEventOption | null',
      detail: 'null | ["raw" | "normalized", number]',
    })
  })

  test('leaves the detail out where it would repeat the summary', () => {
    const subject = component({
      size: { name: 'union', raw: 'number | string' },
    })
    const result = applyPropTypes(
      argTypes({ size: 'union' }),
      subject,
      propTypes(subject, { size: 'number | string' }),
    )

    expect(result.size.table?.type).toEqual({ summary: 'number | string' })
  })

  test('drops a line comment, which would swallow the rest of the summary', () => {
    const raw = '{\n  keys: string[]\n  // TODO\n  flags?: boolean\n}'
    const subject = component({ keyboardShortcuts: { name: 'signature', raw } })
    const result = applyPropTypes(
      argTypes({ keyboardShortcuts: 'signature' }),
      subject,
      propTypes(subject),
    )

    expect(result.keyboardShortcuts.table?.type?.summary).toBe(
      '{ keys: string[] flags?: boolean }',
    )
  })

  test('leaves a summary the story set itself', () => {
    const subject = component({
      wheel: { name: 'union', raw: 'InputEventOption | null' },
    })
    const result = applyPropTypes(
      argTypes({ wheel: "['raw' | 'normalized', number] | null" }),
      subject,
      propTypes(subject, { wheel: 'null | ["raw" | "normalized", number]' }),
    )

    expect(result.wheel.table?.type?.summary).toBe(
      "['raw' | 'normalized', number] | null",
    )
  })

  test('leaves a type Storybook already prints in full', () => {
    const subject = component({
      onChange: { name: 'signature', raw: '(value: number) => void' },
    })
    const result = applyPropTypes(
      argTypes({ onChange: '(value: number) => void' }),
      subject,
      propTypes(subject),
    )

    expect(result.onChange.table?.type?.summary).toBe('(value: number) => void')
  })

  test('leaves plain types alone', () => {
    const subject = component({ min: { name: 'number' } })
    const result = applyPropTypes(
      argTypes({ min: 'number' }),
      subject,
      propTypes(subject),
    )

    expect(result.min.table?.type?.summary).toBe('number')
  })

  test('passes through a component without docgen', () => {
    const given = argTypes({ min: 'number' })
    expect(applyPropTypes(given, undefined, new Map())).toBe(given)
  })

  test('still fills the summary for a component the map does not hold', () => {
    const subject = component({
      size: { name: 'union', raw: 'number | string' },
    })
    const result = applyPropTypes(
      argTypes({ size: 'union' }),
      subject,
      new Map(),
    )

    expect(result.size.table?.type).toEqual({ summary: 'number | string' })
  })
})
