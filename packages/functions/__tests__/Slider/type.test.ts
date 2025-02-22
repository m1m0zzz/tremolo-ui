import { generateOptionsList } from '../../src/components/Slider/type'

describe('unit', () => {
  test('generateOptionsList()', () => {
    expect(generateOptionsList([10, 'mark-number'], 4, 30, 1)).toStrictEqual([
      { value: 10, type: 'mark-number' },
      { value: 20, type: 'mark-number' },
      { value: 30, type: 'mark-number' },
    ])
    expect(generateOptionsList(['step', 'number'], -10, 11, 4)).toStrictEqual([
      { value: -8, type: 'number' },
      { value: -4, type: 'number' },
      { value: 0, type: 'number' },
      { value: 4, type: 'number' },
      { value: 8, type: 'number' },
    ])
    expect(
      generateOptionsList(['step', 'number'], -6.6, -3.3, 3.3),
    ).toStrictEqual([
      { value: -6.6, type: 'number' },
      { value: -3.3, type: 'number' },
    ])
    expect(
      generateOptionsList(['step', 'number'], 410, 500, 400),
    ).toStrictEqual([])
    expect(generateOptionsList(['step', 'number'], 10, 400, 400)).toStrictEqual(
      [{ value: 400, type: 'number' }],
    )
  })
})
