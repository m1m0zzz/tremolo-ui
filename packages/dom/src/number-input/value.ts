import { type Scale, type ValueRange } from '@tremolo-ui/functions'

import { applyDelta } from '../input/apply-delta'
import {
  selectModifier,
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
} from '../input/modifiers'

/**
 * The value a number input edits, and how far it may go.
 *
 * Unlike a slider, either end may be left open, and `clampValue: false` lets
 * the value past the ends that are set.
 */
export interface NumberInputValueOptions {
  min?: number
  max?: number
  step?: number
  scale?: Scale
  /**
   * Keep the value between `min` and `max`.
   *
   * @default true
   */
  clampValue?: boolean
}

/** The ranges {@link nudgeNumberInput} moves a value across. */
export interface NumberInputRanges {
  /** For a `normalized` amount, which needs a finite span to take a share of. */
  normalized: ValueRange
  /** For a `raw` amount, which does not. */
  raw: ValueRange
}

/**
 * The ranges a number input moves its value across, with the open ends
 * filled in.
 *
 * A normalized amount needs a finite span even when an end is unbounded or
 * clamping is off. Safe integers provide one without overflowing the span a
 * scale calculates. A raw amount needs no span, so its open ends can cover
 * every finite number instead of stopping at the safe-integer range.
 */
export function numberInputRanges({
  min,
  max,
  step,
  scale,
  clampValue = true,
}: NumberInputValueOptions): NumberInputRanges {
  const lo = clampValue ? min : undefined
  const hi = clampValue ? max : undefined
  return {
    normalized: {
      min: lo ?? Number.MIN_SAFE_INTEGER,
      max: hi ?? Number.MAX_SAFE_INTEGER,
      step,
      scale,
    },
    raw: {
      min: lo ?? -Number.MAX_VALUE,
      max: hi ?? Number.MAX_VALUE,
      step,
      scale,
    },
  }
}

/**
 * Move a number input's value by one press of a key, a wheel notch or a
 * stepper, picking the range that suits the kind of amount. See `applyDelta`.
 */
export function nudgeNumberInput(
  value: number,
  direction: number,
  options: ModifierValue<InputEventOption>,
  ranges: NumberInputRanges,
  modifiers?: ModifierState,
): number {
  const [mode] = selectModifier(options, modifiers).value
  return applyDelta(
    value,
    direction,
    options,
    mode === 'raw' ? ranges.raw : ranges.normalized,
    modifiers,
  )
}

/**
 * Where the value stands against the ends: whether it can go no further
 * down or up, and whether it lies outside them — which only an unclamped
 * input, or a value set from outside, can do.
 */
export function numberInputBounds(
  value: number,
  { min, max, clampValue = true }: NumberInputValueOptions,
) {
  return {
    atMin: clampValue && min !== undefined && value <= min,
    atMax: clampValue && max !== undefined && value >= max,
    outOfRange:
      (min !== undefined && value < min) || (max !== undefined && value > max),
  }
}

/**
 * The value typed text commits to, or `null` when there is no number in it.
 *
 * Text with no number is not a value: the input should go back to what it
 * was showing rather than commit a zero the user never typed. What is read
 * is clamped here and not while typing, since clamping as the user types
 * would make "1500" impossible to enter into an input whose max is 100.
 */
export function commitNumberInputText(
  text: string,
  parse: (text: string) => number,
  { min, max, clampValue = true }: NumberInputValueOptions,
): number | null {
  const parsed = parse(text)
  if (!Number.isFinite(parsed)) return null
  let committed = parsed
  if (clampValue && min !== undefined) committed = Math.max(committed, min)
  if (clampValue && max !== undefined) committed = Math.min(committed, max)
  return committed
}
