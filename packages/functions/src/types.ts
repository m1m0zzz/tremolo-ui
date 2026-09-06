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

/** One setting per modifier key, with `default` for none of them. */
export type ModifierMap<T> = { default: T } & Partial<Record<Modifier, T>>

/**
 * A single setting, or one per modifier key.
 *
 * @example
 * ['raw', 1]
 * { default: ['raw', 1], shift: ['raw', 0.1] }
 */
export type ModifierValue<T> = T | ModifierMap<T>

/**
 * How much one wheel notch or key press moves the value: a single amount, or
 * one per modifier key.
 */
export type InputEventOptions = ModifierValue<InputEventOption>

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
 * A map is the only form with a `default` key, which is what tells it apart
 * from a bare setting. Tuples are arrays, so they never match.
 */
function isModifierMap<T>(value: ModifierValue<T>): value is ModifierMap<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'default' in value
  )
}

/**
 * Pick the setting that applies, given the modifier keys being held.
 *
 * @example
 * selectModifier({ default: 1, shift: 0.1 }, event)
 */
export function selectModifier<T>(
  options: ModifierValue<T>,
  modifiers?: ModifierState,
): { value: T; modifier: Modifier | null } {
  if (!isModifierMap(options)) {
    // TypeScript cannot subtract the map from `ModifierValue<T>` while `T` is
    // still a type parameter, so the other half has to be spelled out.
    return { value: options as T, modifier: null }
  }
  if (modifiers) {
    for (const modifier of MODIFIER_ORDER) {
      const value = options[modifier]
      // Compared against undefined rather than checked for truthiness: 0 is a
      // legitimate setting.
      if (value !== undefined && modifiers[MODIFIER_FLAG[modifier]]) {
        return { value, modifier }
      }
    }
  }
  return { value: options.default, modifier: null }
}

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
  const { value, modifier } = selectModifier(options, modifiers)
  return { option: value, modifier }
}
