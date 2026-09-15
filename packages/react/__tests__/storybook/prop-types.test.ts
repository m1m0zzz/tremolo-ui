import path from 'node:path'

import { collectPropTypes, propTypesModule } from '../../.storybook/propTypes'

const fixture = path.resolve(__dirname, 'components/fixture.tsx')

describe('collectPropTypes', () => {
  const collected = collectPropTypes([fixture])
  const props = collected.find((c) => c.exportName === 'Fixture')?.props

  test('finds the component', () => {
    expect(props).toBeDefined()
  })

  test('writes a union in the order it was written in', () => {
    // The checker keeps `string` before `number`, whatever the source says.
    expect(props?.size).toBe('number | string')
  })

  test('resolves what an alias stands for', () => {
    expect(props?.mode).toBe('"a" | "b" | null')
  })

  test('resolves a generic against its argument', () => {
    expect(props?.pair).toBe('number | readonly [x: number, y: number]')
  })

  test('leaves undefined off an optional prop, and keeps boolean whole', () => {
    expect(props?.flag).toBe('boolean')
  })

  test('collects namespace members without duplicating their direct exports', () => {
    expect(collected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exportName: 'Namespace',
          member: 'Root',
          props: { value: 'number' },
        }),
        expect.objectContaining({
          exportName: 'Namespace',
          member: 'Part',
          props: { label: 'string' },
        }),
      ]),
    )
    expect(collected.some((entry) => entry.exportName === 'Root')).toBe(false)
    expect(collected.some((entry) => entry.exportName === 'Part')).toBe(false)
  })
})

describe('propTypesModule', () => {
  test('keys the map by the component itself', () => {
    const source = propTypesModule(collectPropTypes([fixture]))

    expect(source).toContain(`import * as m0 from ${JSON.stringify(fixture)}`)
    expect(source).toContain('[m0.Fixture, {')
    expect(source).toContain('[m0.Namespace.Root, {')
    expect(source).toContain('[m0.Namespace.Part, {')
  })
})
