import { parseScaleOrderList } from '@/components/Slider'

describe('unit', () => {
  test('parseScaleOrderList()', () => {
    expect(parseScaleOrderList([10, 'mark-number'], 4, 30, 1)).toStrictEqual([
      { at: 10, type: 'mark-number' },
      { at: 20, type: 'mark-number' },
      { at: 30, type: 'mark-number' },
    ])
    expect(parseScaleOrderList(['step', 'number'], -10, 11, 4)).toStrictEqual([
      { at: -8, type: 'number' },
      { at: -4, type: 'number' },
      { at: 0, type: 'number' },
      { at: 4, type: 'number' },
      { at: 8, type: 'number' },
    ])
    expect(
      parseScaleOrderList(['step', 'number'], -6.6, -3.3, 3.3),
    ).toStrictEqual([
      { at: -6.6, type: 'number' },
      { at: -3.3, type: 'number' },
    ])
    expect(
      parseScaleOrderList(['step', 'number'], 410, 500, 400),
    ).toStrictEqual([])
    expect(parseScaleOrderList(['step', 'number'], 10, 400, 400)).toStrictEqual(
      [{ at: 400, type: 'number' }],
    )
  })
})
