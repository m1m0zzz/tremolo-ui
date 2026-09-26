import type {
  InputEventOption,
  MarksOptions,
  ModifierValue,
} from '@tremolo-ui/dom'
import type { Scale } from '@tremolo-ui/functions'

import type { Snippet } from 'svelte'

export interface SliderProps {
  /** The current value. Bind it (`bind:value`) or update it from `onChange`. */
  value: number
  /** The value at the start of the travel. */
  min: number
  /** The value at the end of the travel. */
  max: number
  /**
   * Granularity of the value. A drag, the wheel and the arrow keys snap it to
   * multiples of `step`.
   * @default 1
   */
  step?: number
  /**
   * How the value is distributed across the travel. Pick one of the scales
   * from `@tremolo-ui/functions`.
   * @default linearScale
   */
  scale?: Scale
  /**
   * Run the slider vertically, with the value growing upwards.
   * @default false
   */
  vertical?: boolean
  /**
   * Grow the value the other way: leftwards, or downwards when `vertical`.
   * @default false
   */
  reverse?: boolean
  /**
   * The cursor to show while dragging.
   * @default { cursor: 'pointer' }
   */
  externalStyles?: { cursor?: string }
  /**
   * How much one notch of the wheel moves the value, while the focus is
   * inside. `null` turns the wheel off.
   * @default ['raw', 1]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much a drag moves the value, per modifier key. `1` follows the
   * pointer; anything else turns the drag relative.
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>
  /**
   * How much one arrow key press moves the value. `null` turns the arrow
   * keys off.
   * @default { default: ['raw', 1], shift: ['raw', 0.1] }
   */
  keyboard?: ModifierValue<InputEventOption> | null
  /**
   * Make the slider unchangeable and remove it from the tab order.
   * The parts carry `data-disabled` while it is set.
   */
  disabled?: boolean
  /**
   * Make the value unchangeable. The parts carry `data-readonly` while it is
   * set.
   */
  readonly?: boolean
  /** Called with the new value when a drag, the wheel or an arrow key moves it. */
  onChange?: (value: number) => void
  /** Called when a drag starts, with the value where the track was pressed. */
  onDragStart?: (value: number) => void
  /** Called when the drag ends, with the value it ended on. */
  onDragEnd?: (value: number) => void
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
  /** The slider renders exactly what you compose here. */
  children: Snippet
}

export interface SliderTrackProps {
  /** How long the track is along the axis the slider runs. Sets `--length`. */
  length?: number | string
  /** How thick the track is across that axis. Sets `--thickness`. */
  thickness?: number | string
  /** Colour of the part from `min` to the value. Sets `--active`. */
  active?: string
  /** Colour of the rest of the track. Sets `--inactive`. */
  inactive?: string
  ref?: HTMLDivElement | null
  children?: Snippet
}

export interface SliderThumbProps {
  /** Sets `--color`, for the theme to colour the thumb with. */
  color?: string
  children?: Snippet
}

export interface SliderMarksProps {
  /** Space between the marks and the track. Sets `--gap`. */
  gap?: number | string
  /**
   * Build the marks instead of writing `Slider.MarksOption` out: a number
   * puts one every that many, `'step'` one every `step`, and
   * `{ per, mark, label }` also turns the mark or the label off for all of
   * them. `children` is ignored while it is set.
   */
  options?: MarksOptions
  children?: Snippet
}

export interface SliderMarksOptionProps {
  /** Where the mark sits, on the same scale as the thumb. */
  value: number
  /**
   * Draw the mark itself.
   * @default true
   */
  mark?: boolean
  /**
   * Text shown next to the mark. Leave it out to show the value; `null`
   * leaves the label out.
   */
  label?: number | string | null
  /** Thickness of the mark. Sets `--thickness`. */
  thickness?: number | string
  /** Length of the mark. Sets `--length`. */
  length?: number | string
  /** Space between the mark and the label. Sets `--gap`. */
  gap?: number | string
  /** Classes for the mark and the label inside the option. */
  classes?: { mark?: string; label?: string }
  /** Styles for the mark and the label inside the option. */
  styles?: { mark?: string; label?: string }
}
