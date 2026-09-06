/**
 * clamp value between min and max
 */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

/**
 * Normalize the value from 0 to 1, spreading the range evenly.
 *
 * This is the linear mapping and takes no curve of its own; a `Scale` builds
 * whatever curve it needs on top of it.
 */
export function normalizeValue(value: number, min: number, max: number) {
  if (min >= max) throw new RangeError('requirements: min < max')
  return clamp((value - min) / (max - min), 0, 1)
}

/**
 * Convert normalized values back to raw values, spreading the range evenly.
 *
 * The inverse of {@link normalizeValue}.
 */
export function rawValue(normalizedValue: number, min: number, max: number) {
  if (min >= max) throw new RangeError('requirements: min < max')
  return min + clamp(normalizedValue, 0, 1) * (max - min)
}

export function stepValue(value: number, step: number) {
  if (step <= 0) throw new RangeError('requirements: step > 0')
  const quotient = Math.floor(value / step)
  const decimalDigits = decimalPart(step)?.length
  const v = toFixed(quotient * step, decimalDigits)
  const next = toFixed((quotient + 1) * step, decimalDigits)
  return Math.abs(value - v) < Math.abs(value - next) ? v : next
}

export function toFixed(x: number, fractionDigits?: number) {
  return Number(x.toFixed(fractionDigits))
}

/**
 * The significant decimal digits a double actually carries. A double holds a
 * little under 16, so anything past this is the binary representation showing
 * through rather than information.
 */
export const SIGNIFICANT_DIGITS = 15

/**
 * Drop the binary artefact from a computed value.
 *
 * Arithmetic on doubles leaves debris in the last couple of digits, and it
 * accumulates: adding 0.1 to 5 twelve times gives 5.699999999999998 rather
 * than 5.7, and the display of a control shows exactly that. Rounding to the
 * digits a double can carry removes it, and adds nothing back — the value was
 * already the result of a calculation whose own error is that size or larger.
 *
 * This is not the same as rounding to a `step`. {@link stepValue} puts a value
 * on a grid the caller asked for and is a decision about the value; this only
 * removes what was never in the value to begin with.
 *
 * @param significantDigits how many digits to keep. The default is the only
 * one that is purely artefact removal; a smaller number starts discarding real
 * precision.
 *
 * @example
 * toPrecision(5.1 + 0.1) // 5.2, rather than 5.199999999999999
 */
export function toPrecision(x: number, significantDigits = SIGNIFICANT_DIGITS) {
  // Zero has no significant digits to round to, and a non-finite value has no
  // decimal form to parse back.
  if (x === 0 || !Number.isFinite(x)) return x
  const rounded = Number(x.toPrecision(significantDigits))
  // Rounding up at the very top of the range overflows to Infinity, which is
  // a worse answer than the artefact.
  return Number.isFinite(rounded) ? rounded : x
}

export function integerPart(x: number | string): string | undefined {
  if (Number.isNaN(x)) {
    return undefined
  }
  return String(x).split('.')[0]
}

export function decimalPart(x: number | string): string | undefined {
  return String(x).split('.')[1]
}

export function radian(degree: number) {
  return (Math.PI * degree) / 180
}

export function degree(radian: number) {
  return (180 * radian) / Math.PI
}

export function mapValue(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

export function dbToGain(db: number) {
  return Math.pow(10, db / 20)
}

export function gainToDb(gain: number) {
  return 20 * (Math.log(gain) / Math.LN10)
}
