import { createContext } from 'svelte'

import type { XY } from '@tremolo-ui/dom'
import type { Scale } from '@tremolo-ui/functions'

/** What `XYPad.Root` shares with its parts. Every field is a getter. */
export interface XYPadContextValue {
  readonly value: XY<number>
  readonly min: XY<number>
  readonly max: XY<number>
  readonly step: XY<number>
  readonly scale: XY<Scale>
  readonly reverse: XY<boolean>
  readonly disabled: boolean
  readonly readonly: boolean
  /** Where the value sits in the area, as percentages from the left and top. */
  readonly percent: XY<number>
  /** Set the value, as an input on the pad would. */
  change: (value: XY<number>) => void
  /** @internal `XYPad.Area` registers the element the pointer is measured against. */
  setArea: (element: HTMLElement | null) => void
  /** @internal `XYPad.Thumb` registers the input the focus goes to. */
  setThumb: (input: HTMLInputElement | null) => void
}

const [get, set] = createContext<XYPadContextValue>()

/** The context of the enclosing `XYPad.Root`, for a part of your own. */
export const useXYPadContext = get
export const setXYPadContext = set
