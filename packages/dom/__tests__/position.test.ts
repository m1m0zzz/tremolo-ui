import { exponentialScale } from '@tremolo-ui/functions'

import { valuePercent } from '../src/position'

test('measured from the start of the travel', () => {
  expect(valuePercent(25, { min: 0, max: 100 })).toBe(25)
  expect(valuePercent(-50, { min: -100, max: 100 })).toBe(25)
})

test('measured from the other end when reversed', () => {
  expect(valuePercent(25, { min: 0, max: 100 }, true)).toBe(75)
})

test('follows the scale', () => {
  const range = { min: 20, max: 20000, scale: exponentialScale }
  expect(valuePercent(20, range)).toBe(0)
  expect(valuePercent(20000, range)).toBe(100)
  expect(valuePercent(632, range)).toBe(50)
})

test('rounded to a whole percentage', () => {
  expect(valuePercent(1, { min: 0, max: 3 })).toBe(33)
  expect(valuePercent(1, { min: 0, max: 3 }, true)).toBe(67)
})
