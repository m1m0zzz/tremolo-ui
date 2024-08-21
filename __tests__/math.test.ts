import { clamp, normalizeValue } from "@/math";

describe('unit', () => {
  test('clamp()', () => {
    expect(clamp(12, 0, 100)).toBe(12)
    expect(clamp(-50, 0, 100)).toBe(0)
    expect(clamp(123, 0, 100)).toBe(100)
  })

  test('normalizeValue()', () => {
    expect(normalizeValue(34, 0, 100)).toBe(0.34)
    expect(normalizeValue(0, -10, 10)).toBe(0.5)
    expect(normalizeValue(-1.6, -2.3, -1.6)).toBe(1)
    expect(normalizeValue(-2.3, -2.3, -1.6)).toBe(0)
    expect(normalizeValue(10e-4, Math.E, Math.PI)).toBe(0)
    expect(normalizeValue(1_000_000_000, Math.E, Math.PI)).toBe(1)
  })

  test('rawValue()', () => {
  })

  test('stepValue()', () => {
  })
})
