import { toXY, type XY, type XYInput } from '../src/xy'

type Axis = { min: number; max: number }

describe('XYInput', () => {
  // These only have to compile. jest does not type check, so what holds them
  // is `npm run typecheck`, which covers __tests__ too.
  test('takes one value for both axes, or a pair', () => {
    const single: XYInput<number> = 1
    const pair: XYInput<number> = [1, 2]
    const readonlyPair: XYInput<number> = [1, 2] as const

    expect([single, pair, readonlyPair]).toHaveLength(3)
  })

  test('takes an object, which is not an array and so is unambiguous', () => {
    const single: XYInput<Axis> = { min: 0, max: 1 }
    const pair: XYInput<Axis> = [
      { min: 0, max: 1 },
      { min: 0, max: 2 },
    ]

    expect([single, pair]).toHaveLength(2)
  })

  test('drops the single form where the value could itself be an array', () => {
    // A lone array would be read as a pair, so only the pair is left.
    const pair: XYInput<number[]> = [
      [1, 2],
      [3, 4],
    ]
    // @ts-expect-error a single array cannot be told from a pair
    const single: XYInput<number[]> = [1, 2]

    expect([pair, single]).toHaveLength(2)
  })
})

describe('toXY', () => {
  test('spreads a single value across both axes', () => {
    expect(toXY(1)).toEqual([1, 1])
  })

  test('keeps a pair as it is', () => {
    expect(toXY([1, 2])).toEqual([1, 2])
  })

  test('copies the pair, so the result is not the input', () => {
    const given = [1, 2] as const
    const result: XY<number> = toXY(given)

    result[0] = 3
    expect(given[0]).toBe(1)
  })

  test('spreads an object without copying it', () => {
    const axis = { min: 0, max: 1 }
    const [x, y] = toXY(axis)

    expect(x).toBe(axis)
    expect(y).toBe(axis)
  })
})
