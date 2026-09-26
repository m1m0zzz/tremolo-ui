/**
 * Which way an input moves a value, before any amount is applied.
 *
 * `applyDelta` takes the direction as given, since which key or which sign of
 * `deltaY` counts as "up" differs per control. The answers are collected here
 * so that every wrapper gives the same one: a knob that turns the other way
 * in one framework would be a bug nobody could see from the code.
 *
 * Two families, by what the control looks like:
 *
 * - **one value** (`Knob`, `Slider`, `NumberInput`): right and up raise it
 * - **a position on screen** (`XYPad`, `PointsEditor`): in screen coordinates,
 *   x growing rightwards and y growing downwards, plus which axis moves
 *
 * A control that runs the other way (`reverse`) flips the result itself.
 */

/** One of the four arrow keys, as `KeyboardEvent.key` names it. */
export type ArrowKey = 'ArrowRight' | 'ArrowLeft' | 'ArrowUp' | 'ArrowDown'

/** Is `key` one of the four arrow keys? */
export function isArrowKey(key: string): key is ArrowKey {
  return (
    key === 'ArrowRight' ||
    key === 'ArrowLeft' ||
    key === 'ArrowUp' ||
    key === 'ArrowDown'
  )
}

/** A move along one of the two axes of a position on screen. */
export interface AxisMove {
  /** 0 = x, 1 = y. */
  axis: 0 | 1
  /** `1` towards the right or the bottom, `-1` towards the left or the top. */
  direction: 1 | -1
}

/**
 * The direction an arrow key moves a single value: right and up raise it.
 * `null` for any other key.
 */
export function arrowKeyDirection(key: string): 1 | -1 | null {
  if (!isArrowKey(key)) return null
  return key === 'ArrowRight' || key === 'ArrowUp' ? 1 : -1
}

/**
 * The axis and direction an arrow key moves a position on screen. `null` for
 * any other key.
 *
 * The key picks the axis, whichever element inside the control holds the
 * focus: a two-dimensional control is one control to the person moving it.
 */
export function arrowKeyMove(key: string): AxisMove | null {
  if (!isArrowKey(key)) return null
  return {
    axis: key === 'ArrowRight' || key === 'ArrowLeft' ? 0 : 1,
    direction: key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1,
  }
}

export interface WheelDirectionOptions {
  /**
   * Read horizontal scrolling as well, for a control laid out horizontally:
   * scrolling right raises the value. Vertical scrolling still counts when
   * there is no horizontal movement.
   *
   * @default false
   */
  horizontal?: boolean
}

/**
 * The direction one wheel event moves a single value: scrolling up raises it.
 * `null` when the event carries no movement the control reads.
 */
export function wheelDirection(
  event: Pick<WheelEvent, 'deltaX' | 'deltaY'>,
  { horizontal = false }: WheelDirectionOptions = {},
): 1 | -1 | null {
  if (horizontal && event.deltaX !== 0) return event.deltaX > 0 ? 1 : -1
  if (event.deltaY === 0) return null
  return event.deltaY > 0 ? -1 : 1
}

/**
 * The axis and direction one wheel event moves a position on screen. `null`
 * when the event carries no movement.
 *
 * Scrolling moves y, and shift switches to x. Browsers turn shift+wheel into
 * horizontal scrolling: `deltaY` comes out empty and `deltaX` carries the
 * movement. Reading whichever axis moved keeps shift working as the x-axis
 * modifier — and picks up a trackpad's own horizontal gesture, which never
 * had a modifier.
 */
export function wheelMove(
  event: Pick<WheelEvent, 'deltaX' | 'deltaY' | 'shiftKey'>,
): AxisMove | null {
  const horizontal = event.deltaX !== 0
  const delta = horizontal ? event.deltaX : event.deltaY
  if (delta === 0) return null
  return {
    axis: horizontal || event.shiftKey ? 0 : 1,
    direction: delta < 0 ? -1 : 1,
  }
}
