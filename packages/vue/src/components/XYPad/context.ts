import { type InjectionKey } from 'vue'

import { type XY } from '@tremolo-ui/dom'
import { type Scale } from '@tremolo-ui/functions'

import { injectContext } from '../_util/context'

/** What `XYPad` shares with its parts. The fields are getters. */
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
  /** @internal `XYPadArea` registers the element the pointer is measured against. */
  setArea: (element: HTMLElement | null) => void
  /** @internal `XYPadThumb` registers the input the focus goes to. */
  setThumb: (input: HTMLInputElement | null) => void
}

export const XYPadKey: InjectionKey<XYPadContextValue> = Symbol('XYPad')

/** The context of the enclosing `XYPad`, for a part of your own. */
export function useXYPadContext(): XYPadContextValue {
  return injectContext(XYPadKey, 'XYPad')
}
