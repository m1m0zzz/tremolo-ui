import { createContext } from 'svelte'

import type { KnobAngles } from '@tremolo-ui/dom'
import type { Scale } from '@tremolo-ui/functions'

/**
 * What `Knob.Root` shares with its parts. Every field is a getter, so reading
 * one inside markup or `$derived` follows the value as it changes.
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

const [get, set] = createContext<KnobContextValue>()

/** The context of the enclosing `Knob.Root`, for a part of your own. */
export const useKnobContext = get
export const setKnobContext = set
