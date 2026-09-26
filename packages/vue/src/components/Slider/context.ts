import { type InjectionKey } from 'vue'

import { type Scale } from '@tremolo-ui/functions'

import { injectContext } from '../_util/context'

/** What `Slider` shares with its parts. The fields are getters. */
export interface SliderContextValue {
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly scale: Scale
  readonly vertical: boolean
  readonly reverse: boolean
  readonly disabled: boolean
  readonly readonly: boolean
  /** Where the value sits along the track, as a percentage from the top or left. */
  readonly percent: number
  /** Set the value, as an input on the slider would. */
  change: (value: number) => void
  /** @internal `SliderTrack` registers the element the pointer is measured against. */
  setTrack: (element: HTMLElement | null) => void
  /** @internal `SliderThumb` registers the input the focus goes to. */
  setThumb: (input: HTMLInputElement | null) => void
}

export const SliderKey: InjectionKey<SliderContextValue> = Symbol('Slider')

/** The context of the enclosing `Slider`, for a part of your own. */
export function useSliderContext(): SliderContextValue {
  return injectContext(SliderKey, 'Slider')
}
