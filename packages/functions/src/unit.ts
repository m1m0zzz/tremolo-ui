/**
 * Units a value can be displayed in, as `[symbol, scale]` pairs ordered from
 * the smallest scale up. A value is shown in the largest unit that does not
 * exceed it.
 *
 * @example
 * [['Hz', 1], ['kHz', 1000]]
 * [['ms', 1], ['s', 1000]]
 */
export type Units = [string, number][]

/**
 * Pick the unit a value is displayed in: the largest one whose scale does not
 * exceed the magnitude of the value.
 */
export function selectUnit(units: Units, value: number): [string, number] {
  let i = 0
  for (; i < units.length; i++) {
    if (Math.abs(units[i][1]) > Math.abs(value)) break
  }
  return units[Math.max(0, i - 1)]
}

/**
 * Render a value as text, in the unit that suits its magnitude.
 *
 * @param units a single symbol appended as-is, or a list to choose from.
 * @param digit digits after the decimal point. Left as-is when omitted.
 *
 * @example
 * formatValue(1234, [['Hz', 1], ['kHz', 1000]], 2) // '1.23kHz'
 * formatValue(1.5, 'Hz')                           // '1.5Hz'
 */
export function formatValue(
  value: number,
  units?: string | Units,
  digit?: number,
): string {
  const fixed = (v: number) =>
    digit != undefined ? v.toFixed(digit) : String(v)
  if (!units || typeof units == 'string') {
    return fixed(value) + (units ?? '')
  }
  const [unit, scale] = selectUnit(units, value)
  return fixed(value / scale) + unit
}

/**
 * Read a value back out of text, undoing the scaling of {@link formatValue}.
 *
 * With a list of units the text has to be a number followed by an optional
 * unit and nothing else, since the unit decides the scale; anything else reads
 * as 0. With a single unit, or none, the first number found anywhere in the
 * text is taken, so a half-typed entry still yields something.
 *
 * @example
 * parseValue('1.23kHz', [['Hz', 1], ['kHz', 1000]]) // 1230
 * parseValue('4abc')                                // 4
 */
export function parseValue(text: string, units?: string | Units): number {
  const str = text.trim()

  if (!units || typeof units == 'string') {
    const m = str.match(/-?\d+(\.\d+)?/)
    const v = Number(m?.[0] ?? '0')
    return isNaN(v) ? 0 : v
  }

  const m = str.match(/^(-?\d+(\.\d+)?)\s*(\w*)$/)
  if (!m) return 0
  const found = units.find(([unit]) => unit == m[3])
  return (Number(m[1]) || 0) * (found ? found[1] : 1)
}
