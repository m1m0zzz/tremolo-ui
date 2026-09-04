import type { InputEventOption } from './types'

/**
 * clamp value between min and max
 */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

/**
 * Normalize the value from 0 to 1
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

export function skewWithCenterValue(
  centerValue: number,
  min: number,
  max: number,
) {
  if (!(min <= centerValue && centerValue <= max))
    throw new RangeError('requirements: min <= centerValue <= max')
  return Math.log(0.5) / Math.log((centerValue - min) / (max - min))
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

/**
 * How a value is scaled: the range it lives in, and how it is rounded.
 *
 * `AxisOptions` of `@tremolo-ui/dom` extends this, so a drag and a
 * wheel / keyboard nudge run the same value pipeline.
 */
export interface ValueRange {
  min: number
  max: number
  /**
   * Rounding applied to the value. Left unrounded when omitted.
   */
  step?: number
  /** @default 1 */
  skew?: number
}

/**
 * Move a value by an amount of input, as reported by a wheel or an arrow key.
 *
 * The pipeline matches `createDragValue` of `@tremolo-ui/dom`: skew, then
 * step, then clamp. Which key or which sign of `deltaY` counts as which
 * direction is left to the caller, since it differs per component.
 *
 * @param direction which way, and how many times, to apply the option. The
 * size of one step is `option[1]`, so this is normally `1` or `-1`.
 *
 * @example
 * // ArrowDown on a slider whose keyboard option is ['raw', 1]
 * applyDelta(value, -1, keyboard, { min, max, step, skew })
 */
export function applyDelta(
  value: number,
  direction: number,
  [mode, amount]: InputEventOption,
  { min, max, step, skew = 1 }: ValueRange,
): number {
  const x = direction * amount
  const next =
    mode == 'normalized'
      ? rawValue(normalizeValue(value, min, max, skew) + x, min, max, skew)
      : value + x
  return clamp(step ? stepValue(next, step) : next, min, max)
}
