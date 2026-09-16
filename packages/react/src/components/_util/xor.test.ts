import { xor } from './xor'

test('xor covers the truth table and treats a missing prop as false', () => {
  expect([
    xor(false, false),
    xor(false, true),
    xor(true, false),
    xor(true, true),
  ]).toEqual([false, true, true, false])
  expect(xor(undefined, true)).toBe(true)
  expect(xor(undefined, undefined)).toBe(false)
})
