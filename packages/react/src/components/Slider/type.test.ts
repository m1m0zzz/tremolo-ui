import { generateOptionsList } from './type'

describe('unit', () => {
  test('generateOptionsList()', () => {
    expect(generateOptionsList(10, 4, 30, 1)).toStrictEqual([
      { value: 10, mark: true, label: true },
      { value: 20, mark: true, label: true },
      { value: 30, mark: true, label: true },
    ])
    expect(
      generateOptionsList({ per: 'step', mark: false }, -10, 11, 4),
    ).toStrictEqual([
      { value: -8, mark: false, label: true },
      { value: -4, mark: false, label: true },
      { value: 0, mark: false, label: true },
      { value: 4, mark: false, label: true },
      { value: 8, mark: false, label: true },
    ])
    expect(generateOptionsList('step', -6.6, -3.3, 3.3)).toStrictEqual([
      { value: -6.6, mark: true, label: true },
      { value: -3.3, mark: true, label: true },
    ])
    expect(generateOptionsList('step', 410, 500, 400)).toStrictEqual([])
    expect(
      generateOptionsList({ per: 'step', label: false }, 10, 400, 400),
    ).toStrictEqual([{ value: 400, mark: true, label: false }])
  })
})
