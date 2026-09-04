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
