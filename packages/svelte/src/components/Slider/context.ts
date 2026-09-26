import { createContext } from 'svelte'

import type { Scale } from '@tremolo-ui/functions'

/**
 * What `Slider.Root` shares with its parts. Every field is a getter, so
 * reading one follows the value as it changes.
 */
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
  /** @internal `Slider.Track` registers the element the pointer is measured against. */
  setTrack: (element: HTMLElement | null) => void
  /** @internal `Slider.Thumb` registers the input the focus goes to. */
  setThumb: (input: HTMLInputElement | null) => void
}

const [get, set] = createContext<SliderContextValue>()

/** The context of the enclosing `Slider.Root`, for a part of your own. */
export const useSliderContext = get
export const setSliderContext = set
