import { createContext, RefObject, useContext } from 'react'

import type { Scale } from '@tremolo-ui/functions'

import type { SliderThumbMethods } from './Thumb'

export type SliderContextValue = {
  value: number
  min: number
  max: number
  step: number
  /** How the value is distributed across the travel. */
  scale: Scale
  vertical: boolean
  reverse: boolean
  disabled: boolean
  readonly: boolean

  /**
   * Position of the thumb, 0-100, already accounting for the display direction
   * implied by `vertical` and `reverse`.
   */
  percent: number

  /** `Track` registers its element here; `Root` normalizes the pointer against it. */
  trackRef: RefObject<HTMLDivElement | null>
  /** `Thumb` registers itself here; `Root` focuses it when a drag starts. */
  thumbRef: RefObject<SliderThumbMethods | null>
}

const SliderContext = createContext<SliderContextValue | null>(null)

export const SliderProvider = SliderContext.Provider

/**
 * Everything here is derived during render, so there is no state to keep in
 * sync: `value` comes from the props of `Root` and the rest follows from it.
 */
export function useSliderContext(): SliderContextValue
export function useSliderContext<T>(
  selector: (state: SliderContextValue) => T,
): T
export function useSliderContext<T>(
  selector?: (state: SliderContextValue) => T,
) {
  const context = useContext(SliderContext)
  if (!context) throw new Error('Missing SliderContext.Provider in the tree')
  return selector ? selector(context) : context
}
