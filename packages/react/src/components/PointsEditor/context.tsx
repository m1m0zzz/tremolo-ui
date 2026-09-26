import { createContext, CSSProperties, RefObject, useContext } from 'react'

import {
  type InputEventOption,
  type ModifierValue,
  type PointsEditorInstance,
  type SelectionBoxRect,
} from '@tremolo-ui/dom'

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
  /**
   * The selection and the moves, from `createPointsEditor` in
   * `@tremolo-ui/dom`: every `Point` registers with it, and a press, a drag,
   * a key or the wheel goes through it so that a selection moves as one.
   */
  editor: PointsEditorInstance
  /** The selection box, while one is being dragged. */
  selectionBox: SelectionBoxRect | null
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
