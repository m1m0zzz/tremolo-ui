import { useEffect } from 'react'

import {
  applyDelta,
  linearScale,
  type InputEventOptions,
  type ModifierState,
  type ValueRange,
} from '@tremolo-ui/functions'

/** Positions probed across the travel. The ends are left out so that the
 * clamp at `min` and `max` cannot be mistaken for a press that does nothing. */
const PROBES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

const NONE: ModifierState = {
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
}

const MODIFIER_STATE: Record<string, ModifierState> = {
  shift: { ...NONE, shiftKey: true },
  alt: { ...NONE, altKey: true },
  ctrl: { ...NONE, ctrlKey: true },
  meta: { ...NONE, metaKey: true },
}

/** Each entry of an `InputEventOptions`, as a name and the keys to hold. */
function entries(
  options: InputEventOptions,
): { name: string; modifiers: ModifierState }[] {
  if (Array.isArray(options)) return [{ name: '', modifiers: NONE }]
  return Object.keys(options).map((key) => ({
    name: key === 'default' ? '' : key,
    modifiers: MODIFIER_STATE[key] ?? NONE,
  }))
}

interface Outcome {
  /** The press changed the value at least once across the travel. */
  moved: boolean
  /** The change reached the displayed text at least once. */
  visible: boolean
}

/**
 * Press every entry of `options` at nine points along the travel and report
 * whether anything came of it.
 *
 * Run against `applyDelta` itself rather than against a reading of `step`:
 * the whole point is that the amount, the step and the scale interact, and
 * the pipeline is the only thing that knows how.
 */
function probe(
  options: InputEventOptions,
  range: ValueRange,
  format?: (value: number) => string,
): Outcome {
  const { min, max, scale = linearScale } = range
  const outcome: Outcome = { moved: false, visible: false }

  for (const { modifiers } of entries(options)) {
    for (const position of PROBES) {
      const value = scale.denormalize(position, min, max)
      const up = applyDelta(value, 1, options, range, modifiers)
      const down = applyDelta(value, -1, options, range, modifiers)
      if (up !== value || down !== value) outcome.moved = true
      if (!format) continue
      const shown = format(value)
      if (format(up) !== shown || format(down) !== shown) outcome.visible = true
    }
  }

  return outcome
}

export interface CheckStepsOptions {
  /** The component, for the message. */
  component: string
  /** The axis, for a component that has more than one. */
  axis?: string
  /**
   * The range to probe, or `null` to check nothing. An unbounded input has no
   * travel to sample, so `NumberInput` passes `null` when `min` and `max` are
   * not both there.
   */
  range: ValueRange | null
  keyboard?: InputEventOptions | null
  wheel?: InputEventOptions | null
  /**
   * How the value is displayed, where the component shows one. Called with
   * probe values only, and only in development.
   */
  format?: (value: number) => string
}

/**
 * Warn, in development only, when a key press or a wheel notch cannot produce
 * a change the user can see.
 *
 * Two settings that are each fine on their own can cancel out, and nothing
 * fails when they do — the control simply sits there:
 *
 * - **`step` coarser than the amount.** `keyboard={['raw', 0.1]}` with
 *   `step={1}` rounds every press straight back to where it started
 * - **the display coarser than the amount.** A `format` showing two decimals
 *   of a kHz value cannot show a press worth 1 Hz
 *
 * The second is only reported when the press is invisible at *every* point
 * along the travel. A display that rounds is a deliberate choice and is
 * normally right — it is being too coarse everywhere that makes it a mistake.
 *
 * @internal
 */
export function useCheckSteps({
  component,
  axis,
  range,
  keyboard,
  wheel,
  format,
}: CheckStepsOptions) {
  const { min, max, step, scale } = range ?? {}
  const where = axis ? `${component} (${axis})` : component

  useEffect(() => {
    try {
      // Inline and first, so a bundler folds the comparison and drops the
      // whole block — the probing and the message strings with it. See
      // `useCheckPlacement` for why it cannot go through a helper, and why
      // it is wrapped.
      if (process.env.NODE_ENV === 'production') return
      if (!range || min === undefined || max === undefined || !(min < max)) {
        return
      }

      for (const [name, options] of [
        ['keyboard', keyboard],
        ['wheel', wheel],
      ] as const) {
        if (!options) continue
        const { moved, visible } = probe(options, range, format)
        if (!moved) {
          console.warn(
            `[tremolo-ui] ${where}: \`${name}\` cannot move the value.` +
              (step !== undefined
                ? ` Each press is smaller than \`step\` (${step}), so it rounds`
                : ' Each press rounds') +
              ' straight back to where it started.',
          )
        } else if (format && !visible) {
          console.warn(
            `[tremolo-ui] ${where}: \`${name}\` moves the value, but \`format\`` +
              ' shows the same text before and after, everywhere in the range.' +
              ' The display is too coarse for it to be seen.',
          )
        }
      }
    } catch {
      // No bundler substituted NODE_ENV, so a production build cannot be told
      // from a development one. Say nothing rather than break.
    }
    // `range` and `format` are rebuilt on most renders, so the effect is keyed
    // on what actually decides the outcome. `format` is left out on purpose:
    // an inline arrow function would make this run every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [where, min, max, step, scale, keyboard, wheel])
}
