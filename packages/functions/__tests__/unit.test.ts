import { unitFormat } from '../src/unit'

describe('unitFormat().format', () => {
  test('picks the prefix that leaves one digit before the point', () => {
    const { format } = unitFormat('Hz')
    expect(format(1)).toBe('1Hz')
    expect(format(999)).toBe('999Hz')
    expect(format(1000)).toBe('1kHz')
    expect(format(1234)).toBe('1.234kHz')
    expect(format(1e6)).toBe('1MHz')
    expect(format(0.5)).toBe('500mHz')
    expect(format(0.0005)).toBe('500µHz')
  })

  test('zero stays in the base unit', () => {
    expect(unitFormat('Hz').format(0)).toBe('0Hz')
    expect(unitFormat('Hz', { digits: 2 }).format(0)).toBe('0.00Hz')
  })

  test('negative values keep their sign and their magnitude', () => {
    const { format } = unitFormat('Hz')
    expect(format(-1234)).toBe('-1.234kHz')
    expect(format(-0.5)).toBe('-500mHz')
  })

  test('digits are decimal places', () => {
    expect(unitFormat('Hz', { digits: 2 }).format(1234)).toBe('1.23kHz')
    expect(unitFormat('Hz', { digits: 0 }).format(1234)).toBe('1kHz')
    expect(unitFormat('Hz', { digits: 4 }).format(1234)).toBe('1.2340kHz')
  })

  test('rounding never carries the number out of its own prefix', () => {
    // 999.99Hz at one digit is 1000.0Hz, which reads as 1.0kHz.
    expect(unitFormat('Hz', { digits: 1 }).format(999.99)).toBe('1.0kHz')
    expect(unitFormat('Hz', { digits: 0 }).format(999.5)).toBe('1kHz')
  })

  test('a value that rounds to zero from below is not shown as -0', () => {
    expect(unitFormat('dB', { prefixes: false, digits: 0 }).format(-0.4)).toBe(
      '0dB',
    )
  })

  test('base says what prefix the stored value is already in', () => {
    const ms = unitFormat('s', { base: 'm' })
    expect(ms.format(1500)).toBe('1.5s')
    expect(ms.format(1)).toBe('1ms')
    expect(ms.format(0.5)).toBe('500µs')
    expect(unitFormat('s', { base: 'm', digits: 2 }).format(1500)).toBe('1.50s')
  })

  test('prefixes: false passes the stored value through', () => {
    expect(unitFormat('dB', { prefixes: false, digits: 1 }).format(-6.25)).toBe(
      '-6.3dB',
    )
    expect(unitFormat('%', { prefixes: false }).format(1234)).toBe('1234%')
    // The symbol has to name the unit the value is already in.
    expect(unitFormat('s', { base: 'm', prefixes: false }).format(1500)).toBe(
      '1500ms',
    )
  })

  test('separator goes between the number and the unit', () => {
    expect(unitFormat('Hz', { separator: ' ' }).format(1234)).toBe('1.234 kHz')
  })

  test('the prefix range is clamped at both ends', () => {
    const { format } = unitFormat('Hz')
    expect(format(1e12)).toBe('1000GHz')
    expect(format(1e-13)).toBe('0.1pHz')
  })

  test('a non-finite value is rendered as itself', () => {
    expect(unitFormat('Hz').format(NaN)).toBe('NaN')
    expect(unitFormat('Hz').format(Infinity)).toBe('Infinity')
  })
})

describe('unitFormat().parse', () => {
  test('undoes format', () => {
    const { format, parse } = unitFormat('Hz')
    for (const value of [0, 1, 999, 1000, 1234, 1e6, 0.5, -1234]) {
      expect(parse(format(value))).toBeCloseTo(value, 9)
    }
  })

  test.each([
    ['Hz', {}, 1234],
    ['Hz', { separator: ' / ' }, 1234],
    ['s', { base: 'm' as const }, 1500],
    ['dB', { prefixes: false, digits: 2 }, -6.25],
    ['%', { prefixes: false, separator: ' ' }, 75],
  ])('round-trips %j with %j', (unit, options, value) => {
    const { format, parse } = unitFormat(unit, options)
    expect(parse(format(value))).toBeCloseTo(value, 9)
  })

  test('rejects a base prefix without a unit', () => {
    expect(() => unitFormat('', { base: 'm' })).toThrow(RangeError)
  })

  test('a bare number is in the unit the value is stored in', () => {
    expect(unitFormat('Hz').parse('1230')).toBe(1230)
    // Stored in ms, so 1500 is 1500ms and not 1500s.
    expect(unitFormat('s', { base: 'm' }).parse('1500')).toBe(1500)
  })

  test('reads a prefix in front of the unit', () => {
    const { parse } = unitFormat('Hz')
    expect(parse('1.23kHz')).toBe(1230)
    expect(parse('1.23 kHz')).toBe(1230)
    expect(parse('500mHz')).toBeCloseTo(0.5, 9)
    expect(parse('2MHz')).toBe(2e6)
  })

  test('reads a bare prefix with no unit', () => {
    expect(unitFormat('Hz').parse('1.2k')).toBe(1200)
  })

  test('the unit symbol wins over the prefix reading', () => {
    // `m` is metres here, so 5m is 5 and not 0.005.
    expect(unitFormat('m').parse('5m')).toBe(5)
    expect(unitFormat('m').parse('5km')).toBe(5000)
  })

  test('prefixes are case sensitive', () => {
    const { parse } = unitFormat('Hz')
    expect(parse('2mHz')).toBeCloseTo(0.002, 9)
    expect(parse('2MHz')).toBe(2e6)
  })

  test('micro is read from all three of its spellings', () => {
    const { parse } = unitFormat('Hz')
    expect(parse('500µHz')).toBeCloseTo(5e-4, 12) // U+00B5
    expect(parse('500μHz')).toBeCloseTo(5e-4, 12) // U+03BC
    expect(parse('500uHz')).toBeCloseTo(5e-4, 12) // what gets typed
  })

  test('base scales the result back to the stored unit', () => {
    const ms = unitFormat('s', { base: 'm' })
    expect(ms.parse('1.5s')).toBeCloseTo(1500, 9)
    expect(ms.parse('500µs')).toBeCloseTo(0.5, 9)
  })

  test('prefixes: false never scales', () => {
    const dB = unitFormat('dB', { prefixes: false })
    expect(dB.parse('-6.3dB')).toBe(-6.3)
    // `d` would be deci if prefixes were read here, and -6dB is not -0.6B.
    expect(dB.parse('-6')).toBe(-6)
  })

  test('text with no number in front reads as NaN, not as zero', () => {
    const { parse } = unitFormat('Hz')
    expect(parse('')).toBeNaN()
    expect(parse('abc')).toBeNaN()
    expect(parse('Hz')).toBeNaN()
  })

  test('an unrecognised suffix is ignored, so half-typed entries still read', () => {
    const { parse } = unitFormat('Hz')
    expect(parse('4abc')).toBe(4)
    expect(parse('1.')).toBe(1)
    expect(parse('-12.5')).toBe(-12.5)
  })
})
