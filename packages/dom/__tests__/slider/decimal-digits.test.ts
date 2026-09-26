import { decimalDigits } from '../../src/slider/decimal-digits'

test('decimalDigits counts the digits written after the point', () => {
  expect(decimalDigits(3)).toBe(0)
  expect(decimalDigits(3.14)).toBe(2)
  expect(decimalDigits(-3.14)).toBe(2)
  expect(decimalDigits(0.1)).toBe(1)
  expect(decimalDigits(100)).toBe(0)
})

test('decimalDigits reads the exponent form', () => {
  // Written out, 1e-7 is 0.0000001 and 1.25e-7 is 0.000000125.
  expect(decimalDigits(1e-7)).toBe(7)
  expect(decimalDigits(1.25e-7)).toBe(9)
  // A positive exponent moves the point past every digit there is.
  expect(decimalDigits(1e21)).toBe(0)
  expect(decimalDigits(1.5e2)).toBe(0)
})

test('decimalDigits has nothing to count for a non-finite value', () => {
  expect(decimalDigits(NaN)).toBe(0)
  expect(decimalDigits(Infinity)).toBe(0)
  expect(decimalDigits(-Infinity)).toBe(0)
})
