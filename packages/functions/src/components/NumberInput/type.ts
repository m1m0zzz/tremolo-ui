/**
 * @module NumberInput
 */

/**
 * [unit, scale][]
 * @example
 * [['Hz', 1], ['kHz', 1000]]
 */
export type Units = [string, number][]

export function selectUnit(units: Units, value: number): [string, number] {
  let i = 0
  for (; i < units.length; i++) {
    if (Math.abs(units[i][1]) > Math.abs(value)) break
  }
  return units[Math.max(0, i - 1)]
}

export function parseValue(
  inputString: string,
  units?: string | Units,
  digit?: number,
): {
  rawValue: number
  formatValue: string
  unit: string
} {
  const str = inputString.trim()
  if (!units || typeof units == 'string') {
    const m = str.match(/-?\d+(\.\d+)?/)
    let v = Number(m?.[0] ?? '0')
    v = isNaN(v) ? 0 : v
    return {
      rawValue: v,
      formatValue: (digit != undefined ? v.toFixed(digit) : v) + (units ?? ''),
      unit: units ?? '',
    }
  }

  const unitList = units.map(([u, _s]) => u)
  const scaleList = units.map(([_u, s]) => s)
  let rawValue = 0
  let unit = unitList[0]
  let formatValue =
    (digit != undefined ? rawValue.toFixed(digit) : rawValue) + unit
  const m = str.match(/^(-?\d+(\.\d+)?)\s*(\w*)$/)
  if (m) {
    rawValue = Number(m[1]) || 0
    const uIndex = unitList.indexOf(m[3])
    rawValue *= uIndex != -1 ? scaleList[uIndex] : 1
    const [u, scale] = selectUnit(units, rawValue)
    const v = rawValue / scale
    formatValue = (digit != undefined ? v.toFixed(digit) : v) + u
    unit = u
  }
  return {
    rawValue: rawValue,
    formatValue: formatValue,
    unit: unit,
  }
}
