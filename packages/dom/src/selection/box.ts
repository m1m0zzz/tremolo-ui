import type { XY } from '../xy'

/**
 * A rectangle in the 0..1 space of whatever the box is drawn over, with `y`
 * growing downwards — the same space the items are given in.
 */
export interface SelectionBoxRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SelectionBoxOptions<Id> {
  /**
   * Everything the box can pick up, read on every move rather than taken as a
   * snapshot: what is under the box changes while it is dragged, and an item
   * may have moved since the last one.
   */
  items: () => Iterable<readonly [Id, XY<number>]>
  /** The box as it is dragged, and `null` once it is gone. */
  onBoxChange?: (box: SelectionBoxRect | null) => void
  /** What the box covers, added to whatever it started from. */
  onSelectionChange?: (ids: Id[]) => void
}

export interface SelectionBoxBeginOptions<Id> {
  /**
   * Add to `selection` rather than replacing it. Ctrl / meta rather than
   * shift, for the controls where shift is the fine-adjustment key.
   */
  additive?: boolean
  /** What was selected before the box started. Only read when `additive`. */
  selection?: readonly Id[]
}

export interface SelectionBoxInstance<Id> {
  /** Replace the given options, without interrupting a box in progress. */
  update: (options: Partial<SelectionBoxOptions<Id>>) => void

  /** Start a box at `at`, which is one of its corners. */
  begin: (at: XY<number>, options?: SelectionBoxBeginOptions<Id>) => void
  /** Drag the opposite corner to `to`. */
  move: (to: XY<number>) => void
  /**
   * Finish the box. The selection stays as it is.
   *
   * @returns whether a box was running, so that a caller can tell a drag from
   *   a press that selected nothing.
   */
  end: () => boolean

  /** The box being dragged, or `null` when there is none. */
  box: () => SelectionBoxRect | null

  destroy: () => void
}

function rectOf(from: XY<number>, to: XY<number>): SelectionBoxRect {
  return {
    x: Math.min(from[0], to[0]),
    y: Math.min(from[1], to[1]),
    width: Math.abs(to[0] - from[0]),
    height: Math.abs(to[1] - from[1]),
  }
}

/** Whether the box covers the point, edges included. */
export function selectionBoxCovers(
  box: SelectionBoxRect,
  [x, y]: XY<number>,
): boolean {
  return (
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  )
}

/**
 * Selecting by dragging a box over a set of items.
 *
 * The drag itself is not here: the caller owns the pointer, and reports where
 * it went in the same 0..1 space the items are given in.
 */
export function createSelectionBox<Id>(
  options: SelectionBoxOptions<Id>,
): SelectionBoxInstance<Id> {
  let opts = options
  let drag: { from: XY<number>; base: readonly Id[] } | null = null
  let box: SelectionBoxRect | null = null

  function setBox(next: SelectionBoxRect | null) {
    box = next
    opts.onBoxChange?.(next)
  }

  function apply(rect: SelectionBoxRect, base: readonly Id[]) {
    const inside: Id[] = []
    for (const [id, at] of opts.items()) {
      if (selectionBoxCovers(rect, at) && !base.includes(id)) inside.push(id)
    }
    opts.onSelectionChange?.([...base, ...inside])
  }

  return {
    update: (next) => {
      opts = { ...opts, ...next }
    },
    begin: (at, { additive = false, selection = [] } = {}) => {
      drag = { from: at, base: additive ? [...selection] : [] }
      setBox(rectOf(at, at))
      // A plain press is a deselect of its own, so that a drag that picks
      // nothing up leaves nothing selected.
      if (!additive) opts.onSelectionChange?.([])
    },
    move: (to) => {
      if (!drag) return
      const rect = rectOf(drag.from, to)
      setBox(rect)
      apply(rect, drag.base)
    },
    end: () => {
      const running = drag !== null
      drag = null
      if (box !== null) setBox(null)
      return running
    },
    box: () => box,
    destroy: () => {
      drag = null
      box = null
    },
  }
}
