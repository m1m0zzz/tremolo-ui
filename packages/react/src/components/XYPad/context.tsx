import { createContext, RefObject, useContext } from 'react'

import type { XYPadThumbMethods } from './Thumb'

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

export type XYPadContextValue = {
  value: XY<number>
  min: XY<number>
  max: XY<number>
  step: XY<number>
  skew: XY<number>
  reverse: XY<boolean>
  disabled: boolean
  readonly: boolean

  /**
   * Position of the thumb, 0-100 per axis, already accounting for `reverse`.
   */
  percent: XY<number>

  /** `Area` registers its element here; `Root` normalizes the pointer against it. */
  areaRef: RefObject<HTMLDivElement | null>
  /** `Thumb` registers itself here; `Root` focuses it when a drag starts. */
  thumbRef: RefObject<XYPadThumbMethods | null>
}

const XYPadContext = createContext<XYPadContextValue | null>(null)

export const XYPadProvider = XYPadContext.Provider

/**
 * Everything here is derived during render, so there is no state to keep in
 * sync: `value` comes from the props of `Root` and the rest follows from it.
 */
export function useXYPadContext(): XYPadContextValue
export function useXYPadContext<T>(selector: (state: XYPadContextValue) => T): T
export function useXYPadContext<T>(selector?: (state: XYPadContextValue) => T) {
  const context = useContext(XYPadContext)
  if (!context) throw new Error('Missing XYPadContext.Provider in the tree')
  return selector ? selector(context) : context
}
