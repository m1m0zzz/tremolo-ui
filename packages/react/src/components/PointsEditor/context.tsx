import { createContext, RefObject, useContext } from 'react'

import type { InputEventOption } from '@tremolo-ui/functions'

import { Cursor } from '../_util'

export type PointsEditorContextValue = {
  disabled: boolean
  readonly: boolean
  /** Inherited by every `Point`; `null` turns the wheel off. */
  wheel: InputEventOption | null
  /** Inherited by every `Point`; `null` turns the keyboard off. */
  keyboard: InputEventOption | null
  externalStyles: {
    userSelectNone?: boolean
    cursor?: Cursor
  }

  /**
   * `Container` registers its element here; `Point` normalizes the pointer
   * against it, so a point is placed by its position within the container.
   */
  containerRef: RefObject<HTMLDivElement | null>
}

const PointsEditorContext = createContext<PointsEditorContextValue | null>(null)

export const PointsEditorProvider = PointsEditorContext.Provider

/**
 * The settings `Root` was given, for the subcomponents to read. There is no
 * state to keep in sync: a point's value belongs to the `Point` that draws it.
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
