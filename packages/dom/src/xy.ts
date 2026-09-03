/**
 * A pair of per-axis values. The tuple elements are labelled, so editors show
 * `[x: number, y: number]` rather than a bare pair.
 */
export type XY<T> = [x: T, y: T]

/**
 * A setting that may be given once for both axes, or per axis.
 *
 * A single value is told from a pair with `Array.isArray`, so the single form
 * is only offered while `T` cannot itself be an array. Where it can, the pair
 * is the only way to write it, since a lone array would be read as a pair.
 */
export type XYInput<T> = [T] extends [readonly unknown[]]
  ? readonly [x: T, y: T]
  : T | readonly [x: T, y: T]

// `Array.isArray` narrows a mutable tuple on its own, but not a readonly one,
// hence the explicit predicate.
function isPair<T>(
  value: T | readonly [x: T, y: T],
): value is readonly [x: T, y: T] {
  return Array.isArray(value)
}

/**
 * Spread a setting that may have been given as a single value.
 *
 * The parameter is written out rather than taken as `XYInput<T>`: a
 * conditional type cannot be narrowed, so the constraint stays where it is
 * declared and this takes both forms.
 *
 * The pair is copied rather than passed along, so that the result is a tuple
 * the caller owns even when a readonly one was given.
 */
export function toXY<T>(value: T | readonly [x: T, y: T]): XY<T> {
  return isPair(value) ? [value[0], value[1]] : [value, value]
}
