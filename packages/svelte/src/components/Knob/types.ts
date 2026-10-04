import type {
  ChangeSource,
  InputEventOption,
  ModifierValue,
} from '@tremolo-ui/dom'
import type { Scale } from '@tremolo-ui/functions'

import type { Snippet } from 'svelte'

export interface KnobProps {
  /**
   * The current value. Bind it (`bind:value`) or update it from `onChange`.
   */
  value: number
  /** The value with the knob turned all the way down. */
  min: number
  /** The value with the knob turned all the way up. */
  max: number
  /**
   * Granularity of the value. A drag, the wheel and the arrow keys snap it to
   * multiples of `step`.
   *
   * @default 1
   */
  step?: number
  /**
   * How the value is distributed across the travel. Pick one of the scales
   * from `@tremolo-ui/functions`.
   *
   * @default linearScale
   */
  scale?: Scale
  /**
   * The value a double click restores. `null` turns the double click off.
   * @default startValue
   */
  resetValue?: number | null
  /**
   * Where the active arc starts. Put it at the centre of a bipolar control,
   * such as a pan knob, so that the arc grows from there either way.
   * @default min
   */
  startValue?: number
  /**
   * Width and height of the knob. Sets `--knob-size`; the size the theme
   * gives it stands when this is omitted.
   */
  size?: number | string
  /**
   * The cursor to show while dragging.
   * @default 'grabbing'
   */
  dragCursor?: string
  /**
   * How much one notch of the wheel moves the value, while the focus is
   * inside. `null` turns the wheel off.
   * @default ['raw', 1]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much a drag moves the value, per modifier key. `1` is 100px for the
   * whole range.
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>
  /**
   * Hide the cursor while dragging and read the pointer movement directly,
   * so the drag does not stop at the edge of the screen.
   * @default false
   */
  pointerLock?: boolean
  /**
   * How much one arrow key press moves the value. `null` turns the arrow
   * keys off.
   * @default { default: ['raw', 1], shift: ['raw', 0.1] }
   */
  keyboard?: ModifierValue<InputEventOption> | null
  /**
   * Make the knob unchangeable and remove it from the tab order.
   * The parts carry `data-disabled` while it is set.
   */
  disabled?: boolean
  /**
   * Make the knob unchangeable while leaving it focusable.
   * The parts carry `data-readonly` while it is set.
   */
  readonly?: boolean
  /**
   * How far the knob turns from `min` to `max`, in degrees, centred on the
   * top.
   * @default 270
   */
  angleRange?: number
  /**
   * Called with the new value when a drag, the wheel, an arrow key or a
   * double click moves it.
   */
  onChange?: (value: number) => void
  /**
   * Called when a change of the value starts — a drag, a double
   * click, the first wheel notch or arrow key — with the value before it and
   * what it is made with. A host recording automation can treat the control
   * as touched from here until `onChangeEnd`.
   */
  onChangeStart?: (value: number, source: ChangeSource) => void
  /**
   * Called when the change ends, with the value it ended on: on release, or
   * `changeEndDelay` after the last wheel notch or arrow key.
   */
  onChangeEnd?: (value: number, source: ChangeSource) => void
  /**
   * How long after the last wheel notch or arrow key the change counts as
   * over, in milliseconds.
   * @default 500
   */
  changeEndDelay?: number
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
  /**
   * The knob renders exactly what you compose here; there is no default
   * markup to fall back to.
   */
  children: Snippet
}

export interface KnobThumbProps {
  /**
   * Fill colour of the circle.
   * @default 'currentColor'
   */
  color?: string
  /**
   * Colour of the line that points at the value.
   * @default 'currentColor'
   */
  lineColor?: string
  /**
   * Diameter of the circle, as a percentage of the knob.
   * @default 84
   */
  size?: number
  /**
   * Thickness of the line, as a percentage of the knob.
   * @default 6
   */
  lineWeight?: number
  /**
   * How far down the line reaches, as a percentage of the knob from its top.
   * @default 35
   */
  lineLength?: number
  /** Classes for the line that points at the value. */
  classes?: { line?: string }
}
