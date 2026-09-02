/**
 * A pair of per-axis values. The tuple elements are labelled, so editors show
 * `[x: number, y: number]` rather than a bare pair.
 */
export type XY<T> = [x: T, y: T]

/** A setting that may be given once for both axes, or per axis. */
export type XYOrSingle<T> = T | XY<T>

/** Spread a setting that may have been given as a single value. */
export function toXY<T>(value: XYOrSingle<T>): XY<T> {
  return Array.isArray(value) ? (value as XY<T>) : [value, value]
}
