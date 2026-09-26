import type {
  InputEventOption,
  ModifierValue,
  PointPosition,
} from '@tremolo-ui/dom'

import type { Snippet } from 'svelte'

export interface PointsEditorProps {
  /** Make the points unchangeable and remove them from the tab order. */
  disabled?: boolean
  /** Make the points unmovable. */
  readonly?: boolean
  /**
   * The cursor to show while dragging a point.
   * @default { cursor: 'grabbing' }
   */
  externalStyles?: { cursor?: string }
  /**
   * How much one notch of the wheel moves the focused `Point`. Scrolling
   * sideways, or with shift held, moves x. A `Point` can override it.
   * @default ['normalized', 0.01]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much one arrow key press moves a `Point`. A `Point` can override it.
   * @default { default: ['normalized', 0.01], shift: ['normalized', 0.001] }
   */
  keyboard?: ModifierValue<InputEventOption> | null
  /**
   * How much a drag moves a `Point`, per modifier key.
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>
  /**
   * Let points be selected, and a selection be moved as one. A selection
   * calls `onChange` on several points in the same tick.
   * @default false
   */
  selectable?: boolean
  /**
   * Ids of the selected points. Bind it (`bind:selection`) to hold the
   * selection yourself.
   */
  selection?: string[]
  /** Called whenever the selection changes. */
  onSelectionChange?: (selection: string[]) => void
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
  /** The editor renders exactly what you compose here. */
  children: Snippet
}

export interface PointsEditorPointProps {
  /** Where the point is, as `{ x, y }` from 0 to 1, with `y` growing downwards. */
  value: PointPosition
  /**
   * How the selection refers to this point. One is generated when it is left
   * out, which lasts as long as the point is mounted.
   */
  id?: string
  /** The lowest position the point can take, per axis. */
  min?: Partial<PointPosition>
  /** The highest position the point can take, per axis. */
  max?: Partial<PointPosition>
  /** Sets `--color`, for the theme to colour the point with. */
  color?: string
  /** Overrides the `disabled` of `PointsEditor.Root`. */
  disabled?: boolean
  /** Overrides the `readonly` of `PointsEditor.Root`. */
  readonly?: boolean
  /** Overrides the `wheel` of `PointsEditor.Root`. */
  wheel?: ModifierValue<InputEventOption> | null
  /** Overrides the `keyboard` of `PointsEditor.Root`. */
  keyboard?: ModifierValue<InputEventOption> | null
  /** The accessible name of each axis, or one for both. */
  'aria-label'?: string | Partial<Record<'x' | 'y', string>>
  /** What the value of each axis means, or one for both. */
  'aria-valuetext'?: string | Partial<Record<'x' | 'y', string>>
  /**
   * Called with the new position when the point is moved, including when it
   * moves along with a selection.
   */
  onChange?: (value: PointPosition) => void
  onDragStart?: (value: PointPosition) => void
  onDragEnd?: (value: PointPosition) => void
  children?: Snippet
}
