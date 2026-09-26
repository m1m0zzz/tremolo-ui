import { createContext, useContext } from 'react'

import { type KnobAngles } from '@tremolo-ui/dom'
import { type Scale } from '@tremolo-ui/functions'

export type KnobConfig = {
  value: number
  min: number
  max: number
  step: number
  scale: Scale
  startValue: number
  /** angle range [degree] */
  angleRange: number
}

export type KnobContextValue = KnobConfig & KnobAngles

const KnobContext = /* @__PURE__ */ createContext<KnobContextValue | null>(null)

export const KnobProvider = KnobContext.Provider

/**
 * Everything here is derived during render, so there is no state to keep in
 * sync: `value` comes from the props of `Root` and the rest follows from it.
 */
export function useKnobContext(): KnobContextValue
export function useKnobContext<T>(selector: (state: KnobContextValue) => T): T
export function useKnobContext<T>(selector?: (state: KnobContextValue) => T) {
  const context = useContext(KnobContext)
  if (!context) throw new Error('Missing KnobContext.Provider in the tree')
  return selector ? selector(context) : context
}
