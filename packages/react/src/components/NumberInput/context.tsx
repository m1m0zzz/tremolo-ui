import { createContext, RefObject, useContext } from 'react'

import type { InputEventOption, ValueRange } from '@tremolo-ui/functions'

export type NumberInputContextValue = {
  value: number

  /**
   * The range the caller asked for. Left undefined when unbounded, which is
   * what `aria-valuemin` / `aria-valuemax` and the steppers need to tell apart
   * from a range that happens to sit at the edge of the safe integers.
   */
  min?: number
  max?: number
  step: number
  skew: number

  disabled: boolean
  readonly: boolean
  clampValue: boolean

  /**
   * The effective scaling for `applyDelta` and for clamping on commit, with the
   * unbounded ends filled in. Ignores `min` / `max` when `clampValue` is off.
   */
  range: ValueRange

  keyboard: InputEventOption | null
  /** Pixels of vertical drag on `Stepper` that move the value by one `step`. */
  drag: number | null

  /** What the input shows: the draft while editing, the formatted value otherwise. */
  text: string
  editing: boolean
  /** Whether the value sits outside `min` / `max`. Not judged while editing. */
  outOfRange: boolean
  /** Whether a stepper would have no effect, for `aria-disabled`. */
  atMin: boolean
  atMax: boolean

  format: (value: number) => string
  parse: (text: string) => number

  /** Typing. Replaces the draft and reports the parsed value, unclamped. */
  setDraft: (text: string) => void
  /** Blur or Enter. Clamps the draft, reports it, and drops the draft. */
  commitDraft: () => void
  /** Drops the draft and replaces the value: steppers, wheel, keyboard, drag. */
  changeValue: (next: number) => void
  /** Moves the value by one `option` in `direction`, normally +1 or -1. */
  nudge: (direction: number, option: InputEventOption) => void

  /** `InputField` registers itself here; `Root` focuses it through its methods. */
  inputRef: RefObject<HTMLInputElement | null>
}

const NumberInputContext = createContext<NumberInputContextValue | null>(null)

export const NumberInputProvider = NumberInputContext.Provider

/**
 * The only state behind this is the editing draft; `value` comes from the props
 * of `Root` and everything else is derived during render.
 */
export function useNumberInputContext(): NumberInputContextValue
export function useNumberInputContext<T>(
  selector: (state: NumberInputContextValue) => T,
): T
export function useNumberInputContext<T>(
  selector?: (state: NumberInputContextValue) => T,
) {
  const context = useContext(NumberInputContext)
  if (!context)
    throw new Error('Missing NumberInputContext.Provider in the tree')
  return selector ? selector(context) : context
}

/** Set by `Stepper` once a drag has actually moved, so the steppers stand down. */
export type StepperContextValue = {
  draggingRef: RefObject<boolean>
}

const StepperContext = createContext<StepperContextValue | null>(null)

export const StepperProvider = StepperContext.Provider

export function useStepperContext(): StepperContextValue | null {
  return useContext(StepperContext)
}
