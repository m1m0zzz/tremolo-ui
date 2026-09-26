import type { InputEventOption, ModifierValue } from '@tremolo-ui/dom'
import type { Scale } from '@tremolo-ui/functions'

import type { Snippet } from 'svelte'

export interface NumberInputProps {
  /** The current value. Bind it (`bind:value`) or update it from `onChange`. */
  value: number
  /** The lowest value. Leave it out for no lower end. */
  min?: number
  /** The highest value. Leave it out for no upper end. */
  max?: number
  /**
   * Granularity of the value. The wheel, the arrow keys and the steppers
   * snap it to multiples of `step`.
   * @default 1
   */
  step?: number
  /**
   * How the value is distributed between `min` and `max`, for a
   * `normalized` amount.
   * @default linearScale
   */
  scale?: Scale
  /**
   * The text shown for a value.
   * @default String
   */
  format?: (value: number) => string
  /**
   * Read a value back out of the text. Has to undo `format`. Text with no
   * number in it reads as `NaN`, which leaves the value alone.
   * @default parseLeadingNumber
   */
  parse?: (text: string) => number
  /**
   * Keep the value within `min` and `max` when it is committed or stepped.
   * Typing is never clamped.
   * @default true
   */
  clampValue?: boolean
  /**
   * How much one notch of the wheel moves the value, while the focus is
   * inside. `null` turns the wheel off.
   * @default ['raw', 1]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much one arrow key press moves the value. `null` turns the arrow
   * keys off.
   * @default { default: ['raw', 1], shift: ['raw', 0.1] }
   */
  keyboard?: ModifierValue<InputEventOption> | null
  /**
   * Pixels of vertical drag on `Stepper` that move the value by one `step`.
   * `null` turns the drag off.
   * @default 1
   */
  drag?: number | null
  /**
   * How much a `Stepper` drag counts, per modifier key.
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>
  /**
   * Hide the cursor while dragging a `Stepper`.
   * @default false
   */
  pointerLock?: boolean
  /**
   * Select the text when `InputField` takes focus: all of it, only the
   * leading number, or nothing.
   * @default 'none'
   */
  selectOnFocus?: 'all' | 'number' | 'none'
  /**
   * Show the plain value while `InputField` has focus, dropping whatever
   * `format` put around it.
   * @default false
   */
  unformatOnFocus?: boolean
  /**
   * Put the caret back at the same digit after an arrow key steps the value.
   * @default false
   */
  keepCaretOnStep?: boolean
  /**
   * Commit and leave the field on Enter.
   * @default true
   */
  blurOnEnter?: boolean
  /** Make the input unchangeable and remove it from the tab order. */
  disabled?: boolean
  /** Make the value unchangeable while leaving the field focusable. */
  readonly?: boolean
  /**
   * Called with the new value: as it is typed (unclamped), and when it is
   * committed or stepped.
   */
  onChange?: (value: number) => void
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
  /** The input renders exactly what you compose here. */
  children: Snippet
}
