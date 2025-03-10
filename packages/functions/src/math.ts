/**
 * clamp value between min and max
 * @category Math
 */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

/**
 * Normalize the value from 0 to 1
 * @category Math
 */
export function normalizeValue(
  rawValue: number,
  min: number,
  max: number,
  skew = 1,
) {
  if (min >= max) throw new RangeError('requirements: min < max')
  const v = clamp((rawValue - min) / (max - min), 0, 1)
  return Math.pow(v, skew)
}

/**
 * Convert normalized values back to raw values.
 * @category Math
 */
export function rawValue(
  normalizedValue: number,
  min: number,
  max: number,
  skew = 1,
) {
  if (min >= max) throw new RangeError('requirements: min < max')
  const v =
    skew == 1
      ? clamp(normalizedValue, 0, 1)
      : Math.exp(Math.log(clamp(normalizedValue, 0, 1)) / skew)
  return min + v * (max - min)
}

/**
 *
 * @category Math
 */
export function skewWithCenterValue(
  centerValue: number,
  min: number,
  max: number,
) {
  if (!(min <= centerValue && centerValue <= max))
    throw new RangeError('requirements: min <= centerValue <= max')
  return Math.log(0.5) / Math.log((centerValue - min) / (max - min))
}

/**
 *
 * @category Math
 */
export function stepValue(value: number, step: number) {
  if (step <= 0) throw new RangeError('requirements: step > 0')
  const quotient = Math.floor(value / step)
  const decimalDigits = decimalPart(step)?.length
  const v = toFixed(quotient * step, decimalDigits)
  const next = toFixed((quotient + 1) * step, decimalDigits)
  return Math.abs(value - v) < Math.abs(value - next) ? v : next
}

/**
 *
 * @category Math
 */
export function toFixed(x: number, fractionDigits?: number) {
  return Number(x.toFixed(fractionDigits))
}

/**
 *
 * @category Math
 */
export function integerPart(x: number | string): string | undefined {
  if (Number.isNaN(x)) {
    return undefined
  }
  return String(x).split('.')[0]
}

/**
 *
 * @category Math
 */
export function decimalPart(x: number | string): string | undefined {
  return String(x).split('.')[1]
}

/**
 *
 * @category Math
 */
export function radian(degree: number) {
  return (Math.PI * degree) / 180
}

/**
 *
 * @category Math
 */
export function degree(radian: number) {
  return (180 * radian) / Math.PI
}

/**
 *
 * @category Math
 */
export function mapValue(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

/**
 *
 * @category Math
 */
export function dbToGain(db: number) {
  return Math.pow(10, db / 20)
}

/**
 *
 * @category Math
 */
export function gainToDb(gain: number) {
  return 20 * (Math.log(gain) / Math.LN10)
}
