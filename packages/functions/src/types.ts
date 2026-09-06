/**
 * Options for setting the amount of keyboard and mouse wheel changes.
 */
export type InputEventOption = ['normalized' | 'raw', number]

/**
 * A modifier key that can carry an amount of its own.
 *
 * `ctrl` and `meta` are kept apart rather than folded into one "command" key:
 * a plugin UI that mirrors a desktop host usually wants the same physical key
 * on every platform, not the platform's own convention.
 */
export type Modifier = 'shift' | 'alt' | 'ctrl' | 'meta'

/** The modifier flags of a `WheelEvent` or a `KeyboardEvent`. */
export interface ModifierState {
  shiftKey: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

/**
 * How much one wheel notch or key press moves the value: a single amount, or
 * one per modifier key.
 *
 * @example
 * ['raw', 1]
 * { default: ['raw', 1], shift: ['raw', 0.1] }
 */
export type InputEventOptions =
  | InputEventOption
  | ({ default: InputEventOption } & Partial<
      Record<Modifier, InputEventOption>
    >)

export interface SelectedInputEvent {
  option: InputEventOption
  /** Which modifier entry was chosen, or `null` for `default`. */
  modifier: Modifier | null
}

/**
 * Checked in this order, and the first one that is both held and configured
 * wins. Fixing an order is what keeps two modifiers held at once from
 * behaving differently between browsers.
 */
const MODIFIER_ORDER = ['meta', 'ctrl', 'alt', 'shift'] as const

const MODIFIER_FLAG = {
  meta: 'metaKey',
  ctrl: 'ctrlKey',
  alt: 'altKey',
  shift: 'shiftKey',
} as const satisfies Record<Modifier, keyof ModifierState>

/**
 * Pick the amount that applies, given the modifier keys being held.
 *
 * @example
 * selectInputEvent({ default: ['raw', 1], shift: ['raw', 0.1] }, event)
 */
export function selectInputEvent(
  options: InputEventOptions,
  modifiers?: ModifierState,
): SelectedInputEvent {
  if (Array.isArray(options)) return { option: options, modifier: null }
  if (modifiers) {
    for (const modifier of MODIFIER_ORDER) {
      const option = options[modifier]
      if (option && modifiers[MODIFIER_FLAG[modifier]]) {
        return { option, modifier }
      }
    }
  }
  return { option: options.default, modifier: null }
}
