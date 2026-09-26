import { type PropType } from 'vue'

import {
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
  type InputEventOption,
  type ModifierValue,
} from '@tremolo-ui/dom'

/** The input props every value control shares, with the core's defaults. */
export const inputProps = {
  /** How much one notch of the wheel moves the value. `null` turns it off. */
  wheel: {
    type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
    default: () => DEFAULT_WHEEL_OPTIONS,
  },
  /** How much one arrow key press moves the value. `null` turns it off. */
  keyboard: {
    type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
    default: () => DEFAULT_KEYBOARD_OPTIONS,
  },
  /** How much a drag moves the value, per modifier key. */
  dragSensitivity: {
    type: [Number, Object] as PropType<ModifierValue<number>>,
    default: () => DEFAULT_DRAG_SENSITIVITY,
  },
} as const
