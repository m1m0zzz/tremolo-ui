export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

// only liner
export function normalizeValue(rawValue: number, min: number, max: number) {
  const v = clamp(rawValue, min, max)
  return (v - min) / (max - min)
}

// only liner
export function rawValue(normalizedValue: number, min: number, max: number) {
  return min + normalizedValue * (max - min)
}

export type RoundMethod = "fixed" | "floor" | "round" | "ceil"

export function roundExtra(method: RoundMethod, value: number, digits: number) {
  if (method == "fixed") {
    return value.toFixed(digits)
  } else if (method == "floor") {

  } else if (method == "round") {

  } else {

  }
}

export function stepValue(value: number, step: number) {
  const digit = step > 1 ? 0 : -Math.log10(step)
  return Number((Math.floor(value / step) * step).toFixed(digit))
}
