import { type PropType } from 'vue'

import {
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
  type InputEventOption,
  type ModifierValue,
} from '@tremolo-ui/dom'

// The input props every value control shares, with the core's defaults. One
// constant each rather than an object to spread: a spread inside
// `defineComponent(...)` counts as a possible side effect to a bundler, which
// then keeps every component that uses it even when none is imported.

/** How much one notch of the wheel moves the value. `null` turns it off. */
export const wheelProp = {
  type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
  default: () => DEFAULT_WHEEL_OPTIONS,
}

/** How much one arrow key press moves the value. `null` turns it off. */
export const keyboardProp = {
  type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
  default: () => DEFAULT_KEYBOARD_OPTIONS,
}

/** How much a drag moves the value, per modifier key. */
export const dragSensitivityProp = {
  type: [Number, Object] as PropType<ModifierValue<number>>,
  default: () => DEFAULT_DRAG_SENSITIVITY,
}
