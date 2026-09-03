/**
 * What an {@link XYInput} setting may hold.
 *
 * A single value and a pair are told apart with `Array.isArray`, which only
 * works while the value itself cannot be an array. Primitives keep that true.
 */
type XYValue = string | number | boolean | symbol | bigint | null | undefined

/**
 * A pair of per-axis values. The tuple elements are labelled, so editors show
 * `[x: number, y: number]` rather than a bare pair.
 */
export type XY<T> = [x: T, y: T]

/** A setting that may be given once for both axes, or per axis. */
export type XYInput<T extends XYValue> = T | readonly [x: T, y: T]

// `Array.isArray` narrows a mutable tuple on its own, but not a readonly one,
// hence the explicit predicate.
function isPair<T extends XYValue>(
  value: XYInput<T>,
): value is XY<T> | readonly [x: T, y: T] {
  return Array.isArray(value)
}

/**
 * Spread a setting that may have been given as a single value.
 *
 * The pair is copied rather than passed along, so that the result is a tuple
 * the caller owns even when a readonly one was given.
 */
export function toXY<T extends XYValue>(value: XYInput<T>): XY<T> {
  return isPair(value) ? [value[0], value[1]] : [value, value]
}
