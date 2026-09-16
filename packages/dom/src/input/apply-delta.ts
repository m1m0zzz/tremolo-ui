import {
  clamp,
  linearScale,
  stepValue,
  toPrecision,
  type ValueRange,
} from '@tremolo-ui/functions'

import {
  selectModifier,
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
} from './modifiers'

/**
 * Move a value by an amount of input, as reported by a wheel or an arrow key.
 *
 * The pipeline matches {@link createDragValue}: scale, then step, then clamp.
 * Which key or which sign of `deltaY` counts as which direction is left to the
 * caller, since it differs per component.
 *
 * @param direction which way, and how many times, to apply the option. The
 * size of one step is `option[1]`, so this is normally `1` or `-1`.
 *
 * @param modifiers the event, for `options` that name a modifier key. See
 * {@link selectModifier}.
 *
 * @example
 * // ArrowDown on a slider whose keyboard option is ['raw', 1]
 * applyDelta(value, -1, keyboard, { min, max, step, scale })
 *
 * @example
 * // Shift+ArrowDown, where `keyboard` is { default: …, shift: ['raw', 0.1] }
 * applyDelta(value, -1, keyboard, range, event)
 */
export function applyDelta(
  value: number,
  direction: number,
  options: ModifierValue<InputEventOption>,
  { min, max, step, scale = linearScale }: ValueRange,
  modifiers?: ModifierState,
): number {
  if (min >= max) throw new RangeError('requirements: min < max')
  if (step !== undefined && (!Number.isFinite(step) || step <= 0)) {
    throw new RangeError(
      'applyDelta step: requirements: finite and greater than 0',
    )
  }

  const {
    value: [mode, amount],
    modifier,
  } = selectModifier(options, modifiers)

  const x = direction * amount
  const next =
    mode === 'normalized'
      ? scale.denormalize(scale.normalize(value, min, max) + x, min, max)
      : value + x

  // Naming a modifier is a deliberate request to move off the grid, so `step`
  // does not apply to it. Without this a finer amount would round straight
  // back to where it started: `stepValue(3 + 0.1, 1)` is 3.
  const quantum = modifier === null ? step : undefined
  const stepped = quantum !== undefined ? stepValue(next, quantum) : next

  // Rounded before the clamp, so that `min` and `max` still have the last
  // word and the value can land on them exactly. Without this the artefact
  // accumulates: with no `step` to round it back, twelve presses of a 0.1
  // modifier amount reach 5.699999999999998 rather than 5.7.
  return clamp(toPrecision(stepped), min, max)
}
