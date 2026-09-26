import { clamp, toPrecision } from '@tremolo-ui/functions'

import { applyDelta } from '../input/apply-delta'
import {
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
} from '../input/modifiers'
import { createSelectionBox, type SelectionBoxRect } from '../selection/box'
import { type XY } from '../xy'

/** Where a point is: 0..1 on each axis, with y growing downwards. */
export interface PointPosition {
  x: number
  y: number
}

/**
 * A point's value is its position in the editor, so its range is the editor:
 * no scaling, and no rounding to a step.
 */
export const POINT_AXIS = { min: 0, max: 1 }

/**
 * How much one wheel notch moves a point by default: a hundredth of the
 * editor, whatever its pixel size.
 */
export const POINTS_EDITOR_DEFAULT_WHEEL: ModifierValue<InputEventOption> = [
  'normalized',
  0.01,
]

/**
 * How much one arrow key press moves a point by default. Shift is the
 * fine-adjustment key everywhere else, so it is bound here too — but only on
 * the keyboard. On the wheel it already means the x axis, and browsers hand
 * shift+wheel over as horizontal scrolling anyway.
 */
export const POINTS_EDITOR_DEFAULT_KEYBOARD: ModifierValue<InputEventOption> = {
  default: ['normalized', 0.01],
  shift: ['normalized', 0.001],
}

/** Keep a point within its range. An axis left out runs from 0 to 1. */
export function clampPoint(
  point: PointPosition,
  min?: Partial<PointPosition>,
  max?: Partial<PointPosition>,
): PointPosition {
  return {
    x: clamp(point.x, min?.x ?? 0, max?.x ?? 1),
    y: clamp(point.y, min?.y ?? 0, max?.y ?? 1),
  }
}

/**
 * What a point tells the editor about itself, so that a selection can be
 * moved without the editor knowing how the points are stored.
 */
export interface PointsEditorPoint {
  value: PointPosition
  min?: Partial<PointPosition>
  max?: Partial<PointPosition>
  /** A point that cannot move stays put while the rest of a selection moves. */
  readonly?: boolean
  onChange?: (value: PointPosition) => void
  /** The point's own element, to match the focus and a press against. */
  element?: Element | null
  /** The wheel option the point resolved, `null` for no wheel. */
  wheel?: ModifierValue<InputEventOption> | null
}

export interface PointsEditorOptions {
  /**
   * Let points be selected, and a selection be moved as one. While it is off
   * nothing is selected, and a drag moves only the point it started on.
   *
   * @default false
   */
  selectable?: boolean
  /**
   * The ids of the selected points. Whoever holds the selection pushes it
   * back with `update()` after {@link PointsEditorOptions.onSelectionChange}.
   */
  selection?: readonly string[]
  /** Called whenever a press or a selection box changes the selection. */
  onSelectionChange?: (selection: string[]) => void
  /** Called whenever the selection box changes, with `null` once it is gone. */
  onSelectionBoxChange?: (rect: SelectionBoxRect | null) => void
}

export interface PointsEditorInstance {
  /** Replace the given options. */
  update: (options: Partial<PointsEditorOptions>) => void
  /**
   * Register a point under `id`. `read` is called whenever the editor needs
   * the point, so it can return what the point is now rather than what it
   * was when it registered. Returns the function that unregisters it.
   */
  registerPoint: (id: string, read: () => PointsEditorPoint) => () => void
  /** Whether the element is a point, or inside one. */
  isPointElement: (element: Element | null | undefined) => boolean
  /**
   * A pointer went down on a point: work out the new selection and remember
   * where everything the drag picked up started.
   *
   * Ctrl / meta add the point to the selection or take it out: shift is the
   * fine-adjustment key on every control here, and it cannot be both. A
   * press on a point already selected keeps the selection, so the group can
   * be dragged.
   */
  beginPointDrag: (id: string, modifiers: ModifierState) => void
  /**
   * Move everything the drag picked up by `delta` from where it started,
   * stopping the whole group together at the edge.
   */
  movePointDrag: (delta: PointPosition) => void
  /**
   * Move `id` — and the selection, when it is part of one — by `delta` from
   * where the points are now: an input that is not a drag has no earlier
   * position to measure against.
   */
  nudgeSelection: (id: string, delta: PointPosition) => void
  /**
   * Move `id` by one press of `option` along one axis, taking the selection
   * along as {@link PointsEditorInstance.nudgeSelection} does.
   */
  nudgePoint: (
    id: string,
    axis: 'x' | 'y',
    direction: number,
    option: ModifierValue<InputEventOption>,
    modifiers?: ModifierState,
  ) => void
  /**
   * Move the point holding the focus by one wheel notch, with its own wheel
   * option. The wheel is listened to once for the whole editor, since a wheel
   * event only reaches what the cursor is over. Returns whether a point took
   * it, so the caller knows whether to consume the event.
   */
  nudgeFocusedPoint: (
    axis: 'x' | 'y',
    direction: number,
    modifiers: ModifierState,
  ) => boolean
  /** A drag on empty space started at `at`: start a selection box there. */
  beginSelectionBox: (at: PointPosition, modifiers: ModifierState) => void
  moveSelectionBox: (to: PointPosition) => void
  /**
   * End the selection box. The press that started it left the focus on
   * nothing, and the arrow keys and the wheel reach a point only through the
   * focus, so it is handed to one of the points the box selected.
   */
  endSelectionBox: () => void
  destroy: () => void
}

const EMPTY: readonly string[] = []

/**
 * How far a group may move before something in it leaves its range.
 *
 * Clamping each point on its own would break the shape of the selection: the
 * one that reached the edge would stop while the rest carried on. One amount
 * for all of them means the whole selection stops together.
 */
function allowedDelta(
  delta: PointPosition,
  entries: { start: PointPosition; point: PointsEditorPoint }[],
): PointPosition {
  let loX = -Infinity
  let hiX = Infinity
  let loY = -Infinity
  let hiY = Infinity
  for (const { start, point } of entries) {
    loX = Math.max(loX, (point.min?.x ?? 0) - start.x)
    hiX = Math.min(hiX, (point.max?.x ?? 1) - start.x)
    loY = Math.max(loY, (point.min?.y ?? 0) - start.y)
    hiY = Math.min(hiY, (point.max?.y ?? 1) - start.y)
  }
  // A point that started outside its own range leaves nothing to move within.
  return {
    x: hiX < loX ? 0 : clamp(delta.x, loX, hiX),
    y: hiY < loY ? 0 : clamp(delta.y, loY, hiY),
  }
}

/**
 * The selection and the moves of a points editor: which points a press or a
 * box selects, and how a selection moves as one.
 *
 * The points stay with the wrapper, which registers each one; the editor only
 * reads them when it needs to, so a point's value can change on every frame
 * of a drag without anything being re-registered.
 */
export function createPointsEditor(
  options: PointsEditorOptions = {},
): PointsEditorInstance {
  let opts = options
  const points = new Map<string, () => PointsEditorPoint>()
  /** What the current drag picked up, and where those points started. */
  let dragged: { id: string; start: PointPosition }[] = []

  const selection = () => (opts.selectable ? (opts.selection ?? EMPTY) : EMPTY)

  function changeSelection(next: string[]) {
    // Read back at once by the drag that follows, before the owner has had a
    // chance to push it with update().
    opts = { ...opts, selection: next }
    opts.onSelectionChange?.(next)
  }

  function snapshot(ids: readonly string[]) {
    return ids.flatMap((id) => {
      const point = points.get(id)?.()
      return point ? [{ id, start: { ...point.value } }] : []
    })
  }

  function moveFrom(
    entries: { id: string; start: PointPosition }[],
    delta: PointPosition,
  ) {
    const withPoint = entries.flatMap((entry) => {
      const point = points.get(entry.id)?.()
      return point ? [{ ...entry, point }] : []
    })
    const allowed = allowedDelta(delta, withPoint)
    for (const { start, point } of withPoint) {
      if (point.readonly) continue
      // Rounded here as well as in the pipeline: a move is a subtraction and
      // an addition of its own, and that is enough to put the binary artefact
      // back (0.2 + 0.1 lands on 0.30000000000000004).
      point.onChange?.({
        x: toPrecision(start.x + allowed.x),
        y: toPrecision(start.y + allowed.y),
      })
    }
  }

  function nudgeSelection(id: string, delta: PointPosition) {
    const current = selection()
    moveFrom(snapshot(current.includes(id) ? current : [id]), delta)
  }

  function nudgePoint(
    id: string,
    axis: 'x' | 'y',
    direction: number,
    option: ModifierValue<InputEventOption>,
    modifiers?: ModifierState,
  ) {
    const point = points.get(id)?.()
    if (!point) return
    const { value } = point
    const next = applyDelta(
      value[axis],
      direction,
      option,
      POINT_AXIS,
      modifiers,
    )
    // As a move, so that the rest of the selection comes along and the whole
    // group stops together at the edge.
    nudgeSelection(id, {
      x: axis === 'x' ? next - value.x : 0,
      y: axis === 'y' ? next - value.y : 0,
    })
  }

  const box = createSelectionBox<string>({
    *items(): Generator<readonly [string, XY<number>]> {
      for (const [id, read] of points) {
        const { x, y } = read().value
        yield [id, [x, y]]
      }
    },
    onBoxChange: (rect) => opts.onSelectionBoxChange?.(rect),
    onSelectionChange: changeSelection,
  })

  return {
    update: (next) => {
      opts = { ...opts, ...next }
    },
    registerPoint: (id, read) => {
      points.set(id, read)
      return () => {
        if (points.get(id) === read) points.delete(id)
      }
    },
    isPointElement: (element) => {
      if (!element) return false
      for (const read of points.values()) {
        if (read().element?.contains(element)) return true
      }
      return false
    },
    beginPointDrag: (id, modifiers) => {
      if (!opts.selectable) {
        dragged = snapshot([id])
        return
      }
      const current = selection()
      const additive = modifiers.ctrlKey || modifiers.metaKey
      let next: readonly string[]
      if (additive) {
        next = current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id]
      } else if (current.includes(id)) {
        next = current
      } else {
        next = [id]
      }
      changeSelection([...next])
      // A press that took the point out of the selection was a deselect, not
      // the start of a move, so there is nothing to drag.
      dragged = next.includes(id) ? snapshot(next) : []
    },
    movePointDrag: (delta) => moveFrom(dragged, delta),
    nudgeSelection,
    nudgePoint,
    nudgeFocusedPoint: (axis, direction, modifiers) => {
      const active = globalThis.document?.activeElement
      if (!active) return false
      for (const [id, read] of points) {
        const { element, wheel, readonly, onChange } = read()
        // A point answers only for the focus inside its own inputs, so both
        // axes stay part of the same interaction.
        if (!element?.contains(active)) continue
        if (!wheel || readonly || !onChange) return false
        nudgePoint(id, axis, direction, wheel, modifiers)
        return true
      }
      return false
    },
    beginSelectionBox: (at, modifiers) => {
      if (!opts.selectable) return
      box.begin([at.x, at.y], {
        additive: modifiers.ctrlKey || modifiers.metaKey,
        selection: selection(),
      })
    },
    moveSelectionBox: (to) => box.move([to.x, to.y]),
    endSelectionBox: () => {
      if (!box.end()) return
      const [first] = selection()
      const element = first ? points.get(first)?.().element : null
      if (element && 'focus' in element) (element as HTMLElement).focus()
    },
    destroy: () => {
      box.destroy()
      dragged = []
    },
  }
}
