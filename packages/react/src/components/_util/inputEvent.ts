import type { InputEventOptions, ModifierValue } from '@tremolo-ui/functions'

/**
 * The keyboard amount every component starts with: one `step` per press, and
 * a tenth of that with shift held.
 *
 * Shift is the fine-adjustment key on hardware controllers and in every DAW,
 * so it is bound by default rather than left to be discovered. A modifier
 * entry is not snapped to `step`, which is what lets the finer amount move at
 * all — see `applyDelta`.
 *
 * A module level constant so that passing it as a default does not hand a new
 * object to memo dependencies on every render.
 */
export const DEFAULT_KEYBOARD_OPTIONS: InputEventOptions = {
  default: ['raw', 1],
  shift: ['raw', 0.1],
}

/**
 * Wheel has no modifier bound by default.
 *
 * Browsers turn shift+wheel into horizontal scrolling, which empties `deltaY`
 * and fills `deltaX`, so shift is not ours to take here. A caller who wants a
 * modifier on the wheel can still name one.
 */
export const DEFAULT_WHEEL_OPTIONS: InputEventOptions = ['raw', 1]

/**
 * How much a drag counts, per modifier. `1` is the normal travel; `0.1` makes
 * the same movement cover a tenth of the range.
 *
 * Shift is bound to match the arrow keys, where it also moves a tenth.
 */
export const DEFAULT_DRAG_SENSITIVITY: ModifierValue<number> = {
  default: 1,
  shift: 0.1,
}
