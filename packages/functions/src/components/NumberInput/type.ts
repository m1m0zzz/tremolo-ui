/**
 * @module NumberInput
 */

import { toFixed } from '../../math'

/**
 * [unit, scale][]
 * @example
 * [['Hz', 1], ['kHz', 1000]]
 */
export type Units = [string, number][]

export function selectUnit(units: Units, value: number): [string, number] {
  if (typeof units == 'string') return [units, 1]

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
) {
  let str = inputString.trim()
  if (str == '') str = '0'
  // TODO: digit is not considered
  if (!units) {
    return {
      rawValue: Number(str) || 0,
      formatValue: str,
      unit: '',
    }
  } else if (typeof units == 'string') {
    const m = str.match(/-?\d+(\.\d+)?/)
    str = m?.[0] ?? '0'
    return {
      rawValue: Number(str) || 0,
      formatValue: `${str}${units}`,
      unit: units,
    }
  }

  const unitList = units.map(([u, _s]) => u)
  const scaleList = units.map(([_u, s]) => s)
  let rawValue = 0
  let formatValue = `${scaleList[0]}`
  let unit = unitList[0]
  const m = str.match(/^(-?\d+(\.\d+)?)\s*(\w*)$/)
  if (m) {
    rawValue = Number(m[1]) || 0
    const inputUnit = m[3]
    if (inputUnit != '' && unitList.indexOf(inputUnit) != -1) {
      rawValue *= scaleList[unitList.indexOf(inputUnit)]
      const s = selectUnit(units, rawValue)
      const v = rawValue / s[1]
      formatValue = `${digit != undefined ? toFixed(v, digit) : v}${s[0]}`
      unit = s[0]
    } else {
      const [u, scale] = selectUnit(units, rawValue)
      const v = rawValue / scale
      formatValue = `${digit != undefined ? toFixed(v, digit) : v}${u}`
      unit = u
    }
  }
  return {
    rawValue: rawValue,
    formatValue: formatValue,
    unit: unit,
  }
}

// TODO: toFixed 以外のフォーマット手法
// e.g. 小数点第n位
export function formatValue(value: number, units?: string | Units) {
  if (!units) {
    return `${value}`
  } else if (typeof units == 'string') {
    return `${value}${units}`
  } else {
    const [unit, scale] = selectUnit(units, value)
    return `${toFixed(value / scale)}${unit}`
  }
}
