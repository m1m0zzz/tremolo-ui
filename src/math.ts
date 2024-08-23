export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

export function normalizeValue(rawValue: number, min: number, max: number, skew = 1) {
  if (min >= max) throw new RangeError("requirements: min < max")
  const v = clamp((rawValue - min) / (max - min), 0, 1)
  return Math.pow(v, skew)
}

export function rawValue(normalizedValue: number, min: number, max: number, skew = 1) {
  if (min >= max) throw new RangeError("requirements: min < max")
  const v = (skew == 1) ?
    clamp(normalizedValue, 0, 1) :
    Math.exp(Math.log(clamp(normalizedValue, 0, 1)) / skew)
  return min + v * (max - min)
}

export function skewWithCenterValue(centerValue: number, min: number, max: number) {
  if (!(min <= centerValue && centerValue <= max))
    throw new RangeError("requirements: min <= centerValue <= max")
  return Math.log(0.5) / Math.log((centerValue - min) / (max - min));
}

export function stepValue(value: number, step: number) {
  if (step <= 0) throw new RangeError("requirements: step > 0")
  const quotient = Math.floor(value / step)
  const decimalDigits = decimalPart(step)?.length
  const v = toFixed(quotient * step, decimalDigits)
  const next = toFixed((quotient + 1) * step, decimalDigits)
  return Math.abs(value - v) < Math.abs(value - next) ? v : next
}

export function toFixed(x: number, fractionDigits?: number) {
  return Number(x.toFixed(fractionDigits))
}

export function decimalPart(x: number | string): string | undefined {
  return String(x).split(".")[1]
}
