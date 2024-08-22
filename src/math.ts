export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

// only liner
export function normalizeValue(rawValue: number, min: number, max: number, skew = 1) {
  const v = clamp((rawValue - min) / (max - min), 0, 1)
  return Math.pow(v, skew)
}

// only liner
export function rawValue(normalizedValue: number, min: number, max: number, skew = 1) {
  const v = (skew == 1) ?
    clamp(normalizedValue, 0, 1) :
    Math.exp(Math.log(clamp(normalizedValue, 0, 1)) / skew)
  return min + v * (max - min)
}

export function skewWithCenterCenter(centerValue: number, min: number, max: number) {
  return Math.log(0.5) / Math.log((centerValue - min) / (max - min));
}

export function stepValue(value: number, step: number) {
  if (step <= 0) throw new RangeError("requirements: step > 0")
  const quotient = Math.floor(value / step)
  const v = quotient * step
  const next = (quotient + 1) * step
  return Math.abs(value - v) < Math.abs(value - next) ? v : next
}
