import type { InputEventOption, ModifierValue } from '@tremolo-ui/functions'

/**
 * The keyboard amount used by Knob, NumberInput, Slider, and XYPad by default:
 * one `step` per press, and a tenth of that with shift held.
 *
 * A modifier entry is not snapped to `step`, which is what lets the finer
 * amount move at all — see `applyDelta` in `@tremolo-ui/functions`.
 */
export const DEFAULT_KEYBOARD_OPTIONS: ModifierValue<InputEventOption> = {
  default: ['raw', 1],
  shift: ['raw', 0.1],
}

/**
 * The wheel amount used by Knob, NumberInput, Slider, and XYPad by default.
 *
 * Browsers turn shift+wheel into horizontal scrolling, which empties `deltaY`
 * and fills `deltaX`, so no modifier is bound here.
 */
export const DEFAULT_WHEEL_OPTIONS: ModifierValue<InputEventOption> = ['raw', 1]

/**
 * The drag sensitivity used by value controls by default. Shift makes the
 * same movement cover a tenth of the range, matching the arrow keys.
 */
export const DEFAULT_DRAG_SENSITIVITY: ModifierValue<number> = {
  default: 1,
  shift: 0.1,
}
