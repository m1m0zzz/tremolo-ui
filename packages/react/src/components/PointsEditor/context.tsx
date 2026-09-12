import { createContext, CSSProperties, RefObject, useContext } from 'react'

import type { SelectionBoxRect } from '@tremolo-ui/dom'
import type {
  InputEventOption,
  ModifierState,
  ModifierValue,
} from '@tremolo-ui/functions'

import type { PointBaseType } from './Point'

/**
 * What a `Point` tells the editor about itself, so that a selection can be
 * moved without the editor knowing how the points are stored.
 *
 * Held behind a ref and rewritten on every render: the value changes on every
 * frame of a drag, and a registry keyed on it would be rebuilt just as often.
 */
export interface PointRegistration {
  value: PointBaseType
  min?: Partial<PointBaseType>
  max?: Partial<PointBaseType>
  readonly: boolean
  onChange?: (value: PointBaseType) => void
  /** The point's own element, to match the focus against. */
  element: HTMLElement | null
  /** The wheel option this point resolved, root inheritance applied. */
  wheel: ModifierValue<InputEventOption> | null
}

export type PointsEditorContextValue = {
  disabled: boolean
  readonly: boolean
  /** Inherited by every `Point`; `null` turns the wheel off. */
  wheel: ModifierValue<InputEventOption> | null
  /** Inherited by every `Point`; `null` turns the keyboard off. */
  keyboard: ModifierValue<InputEventOption> | null
  /** Inherited by every `Point`. See `PointsEditorProps.dragSensitivity`. */
  dragSensitivity: ModifierValue<number>
  externalStyles: {
    cursor?: CSSProperties['cursor']
  }

  /**
   * `Container` registers its element here; `Point` normalizes the pointer
   * against it, so a point is placed by its position within the container.
   */
  containerRef: RefObject<HTMLDivElement | null>

  /** Whether points can be selected at all. See `PointsEditorProps.selectable`. */
  selectable: boolean
  /** Ids of the points currently selected. Always empty while `selectable` is off. */
  selection: readonly string[]
  /** Register a point so that a selection can move it with the rest. */
  registerPoint: (id: string, entry: RefObject<PointRegistration>) => () => void
  /**
   * A pointer went down on a point: works out the new selection and takes the
   * snapshot the move will be measured against.
   */
  beginPointDrag: (id: string, modifiers: ModifierState) => void
  /** Move everything the drag picked up, by one amount, clamped as one. */
  movePointDrag: (delta: PointBaseType) => void
  /**
   * Move the selection by an amount that did not come from a drag — an arrow
   * key or a wheel notch. The current values are the starting point.
   */
  nudgeSelection: (id: string, delta: PointBaseType) => void
  /**
   * Move the point that currently holds focus by one notch. The wheel listener
   * belongs to `Container` rather than to every `Point`, so the lookup of who
   * has focus happens here, where the registry is. Returns whether a point
   * took it, so the caller knows whether to consume the event.
   */
  nudgeFocusedPoint: (
    axis: 'x' | 'y',
    direction: number,
    modifiers: ModifierState,
  ) => boolean

  /** The selection box, while one is being dragged. */
  selectionBox: SelectionBoxRect | null
  beginSelectionBox: (at: PointBaseType, modifiers: ModifierState) => void
  moveSelectionBox: (to: PointBaseType) => void
  endSelectionBox: () => void
}

const PointsEditorContext =
  /* @__PURE__ */ createContext<PointsEditorContextValue | null>(null)

export const PointsEditorProvider = PointsEditorContext.Provider

/**
 * The settings `Root` was given, for the subcomponents to read. A point's
 * value still belongs to the `Point` that draws it; what the root keeps is
 * which points are selected, and a registry of who they are.
 */
export function usePointsEditorContext(): PointsEditorContextValue
export function usePointsEditorContext<T>(
  selector: (state: PointsEditorContextValue) => T,
): T
export function usePointsEditorContext<T>(
  selector?: (state: PointsEditorContextValue) => T,
) {
  const context = useContext(PointsEditorContext)
  if (!context)
    throw new Error('Missing PointsEditorContext.Provider in the tree')
  return selector ? selector(context) : context
}
