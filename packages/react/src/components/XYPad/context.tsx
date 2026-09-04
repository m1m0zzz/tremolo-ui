import { createContext, RefObject, useContext } from 'react'

import { toXY, type XY, type XYInput } from '@tremolo-ui/dom'
import type { Scale } from '@tremolo-ui/functions'

import type { XYPadThumbMethods } from './Thumb'

export { toXY, type XY, type XYInput }

export type XYPadContextValue = {
  value: XY<number>
  min: XY<number>
  max: XY<number>
  step: XY<number>
  /** How the value of each axis is distributed across the travel. */
  scale: XY<Scale>
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
