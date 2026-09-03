import { applyRawTypeSummaries } from '../../.storybook/argTypes'

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

describe('applyRawTypeSummaries', () => {
  test('replaces a bare kind name with the type as written', () => {
    const result = applyRawTypeSummaries(
      argTypes({ wheel: 'union' }),
      component({
        wheel: { name: 'union', raw: 'InputEventOption | null' },
      }),
    )

    expect(result.wheel.table?.type?.summary).toBe('InputEventOption | null')
  })

  test('leaves a summary the story set itself', () => {
    const result = applyRawTypeSummaries(
      argTypes({ wheel: "['raw' | 'normalized', number] | null" }),
      component({ wheel: { name: 'union', raw: 'InputEventOption | null' } }),
    )

    expect(result.wheel.table?.type?.summary).toBe(
      "['raw' | 'normalized', number] | null",
    )
  })

  test('leaves a type that is already printed in full', () => {
    // Storybook prints Array / Record / signature from `raw` on its own.
    const result = applyRawTypeSummaries(
      argTypes({ onChange: '(value: number) => void' }),
      component({
        onChange: { name: 'signature', raw: '(value: number) => void' },
      }),
    )

    expect(result.onChange.table?.type?.summary).toBe('(value: number) => void')
  })

  test('leaves plain types alone', () => {
    const result = applyRawTypeSummaries(
      argTypes({ min: 'number' }),
      component({ min: { name: 'number' } }),
    )

    expect(result.min.table?.type?.summary).toBe('number')
  })

  test('passes through a component without docgen', () => {
    const given = argTypes({ min: 'number' })
    expect(applyRawTypeSummaries(given, undefined)).toBe(given)
  })
})

describe('applyRawTypeSummaries, multi-line types', () => {
  test('collapses the summary and keeps the whole shape as the detail', () => {
    const raw = '{\n  userSelectNone?: boolean\n  cursor?: Cursor\n}'
    const result = applyRawTypeSummaries(
      argTypes({ externalStyles: 'signature' }),
      component({ externalStyles: { name: 'signature', raw } }),
    )

    expect(result.externalStyles.table?.type?.summary).toBe(
      '{ userSelectNone?: boolean cursor?: Cursor }',
    )
    expect(result.externalStyles.table?.type?.detail).toBe(raw)
  })
})
