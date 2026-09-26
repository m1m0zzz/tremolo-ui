import { type InjectionKey } from 'vue'

import { type KnobAngles } from '@tremolo-ui/dom'
import { type Scale } from '@tremolo-ui/functions'

import { injectContext } from '../_util/context'

/**
 * What `Knob` shares with its parts. The fields are getters, so reading one in
 * a render or a `computed` follows the value as it changes.
 */
export interface KnobContextValue {
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly scale: Scale
  readonly startValue: number
  /** How far the knob turns from `min` to `max`, in degrees. */
  readonly angleRange: number
  /** The angles the parts are drawn with. See `knobAngles` in `@tremolo-ui/dom`. */
  readonly angles: KnobAngles
}

export const KnobKey: InjectionKey<KnobContextValue> = Symbol('Knob')

/** The context of the enclosing `Knob`, for a part of your own. */
export function useKnobContext(): KnobContextValue {
  return injectContext(KnobKey, 'Knob')
}
