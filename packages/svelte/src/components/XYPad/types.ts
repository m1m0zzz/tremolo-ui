import type {
  InputEventOption,
  ModifierValue,
  XY,
  XYInput,
} from '@tremolo-ui/dom'
import type { Scale } from '@tremolo-ui/functions'

import type { Snippet } from 'svelte'

/**
 * The per-axis settings mirror `Slider`, given as `[x, y]` tuples. A plain
 * value applies to both axes.
 */
export interface XYPadProps {
  /** The current value as `[x, y]`. Bind it or update it from `onChange`. */
  value: XY<number>
  /** The value at the start of the travel, per axis. */
  min: XYInput<number>
  /** The value at the end of the travel, per axis. */
  max: XYInput<number>
  /**
   * Granularity of the value, per axis.
   * @default 1
   */
  step?: XYInput<number>
  /**
   * How the value is distributed across the travel, per axis.
   * @default linearScale
   */
  scale?: XYInput<Scale>
  /**
   * Grow the value the other way, per axis. `y` grows downwards unless
   * reversed.
   * @default false
   */
  reverse?: XYInput<boolean>
  /**
   * How much one notch of the wheel moves the value, while the focus is
   * inside. Scrolling sideways, or with shift held, moves x.
   * @default ['raw', 1]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much a drag moves the value, per modifier key.
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>
  /**
   * How much one arrow key press moves the value. Left and right move x, up
   * and down move y.
   * @default { default: ['raw', 1], shift: ['raw', 0.1] }
   */
  keyboard?: ModifierValue<InputEventOption> | null
  /**
   * The cursor to show while dragging.
   * @default { cursor: 'pointer' }
   */
  externalStyles?: { cursor?: string }
  /** Make the pad unchangeable and remove it from the tab order. */
  disabled?: boolean
  /** Make the value unchangeable. */
  readonly?: boolean
  onChange?: (value: XY<number>) => void
  onDragStart?: (value: XY<number>) => void
  onDragEnd?: (value: XY<number>) => void
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
  /** The pad renders exactly what you compose here. */
  children: Snippet
}

export interface XYPadThumbProps {
  /** Sets `--color`, for the theme to colour the thumb with. */
  color?: string
  /** The accessible name of each axis, as `[x, y]`. */
  'aria-label'?: XYInput<string | undefined | null>
  /** The ids of what labels each axis, as `[x, y]` or one for both. */
  'aria-labelledby'?: XYInput<string | undefined | null>
  /** The ids of what describes each axis, as `[x, y]` or one for both. */
  'aria-describedby'?: XYInput<string | undefined | null>
  /** What the value of each axis means, as `[x, y]` or one for both. */
  'aria-valuetext'?: XYInput<string | undefined | null>
  children?: Snippet
}
