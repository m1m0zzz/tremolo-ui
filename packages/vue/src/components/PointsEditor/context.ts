import { type InjectionKey } from 'vue'

import {
  type InputEventOption,
  type ModifierValue,
  type PointsEditorInstance,
  type SelectionBoxRect,
} from '@tremolo-ui/dom'

import { injectContext } from '../_util/context'

/** What `PointsEditor` shares with its parts. The fields are getters. */
export interface PointsEditorContextValue {
  readonly disabled: boolean
  readonly readonly: boolean
  readonly wheel: ModifierValue<InputEventOption> | null
  readonly keyboard: ModifierValue<InputEventOption> | null
  readonly dragSensitivity: ModifierValue<number>
  readonly cursor: string
  readonly selectable: boolean
  /** Ids of the selected points. Always empty while `selectable` is off. */
  readonly selection: readonly string[]
  /** The selection box, while one is being dragged. */
  readonly selectionBox: SelectionBoxRect | null
  /** The element points are placed in and measured against. */
  readonly container: HTMLElement | null
  /** The selection and the moves, from `createPointsEditor` in `@tremolo-ui/dom`. */
  readonly editor: PointsEditorInstance
  /** @internal `PointsEditorContainer` registers its element. */
  setContainer: (element: HTMLElement | null) => void
}

export const PointsEditorKey: InjectionKey<PointsEditorContextValue> =
  Symbol('PointsEditor')

/** The context of the enclosing `PointsEditor`, for a part of your own. */
export function usePointsEditorContext(): PointsEditorContextValue {
  return injectContext(PointsEditorKey, 'PointsEditor')
}
