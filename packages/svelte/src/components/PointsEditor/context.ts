import { createContext } from 'svelte'

import type {
  InputEventOption,
  ModifierValue,
  PointsEditorInstance,
  SelectionBoxRect,
} from '@tremolo-ui/dom'

/** What `PointsEditor.Root` shares with its parts. Every field is a getter. */
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
  /**
   * The selection and the moves, from `createPointsEditor` in
   * `@tremolo-ui/dom`: every `Point` registers with it.
   */
  readonly editor: PointsEditorInstance
  /** @internal `Container` registers its element. */
  setContainer: (element: HTMLElement | null) => void
}

const [get, set] = createContext<PointsEditorContextValue>()

/** The context of the enclosing `PointsEditor.Root`, for a part of your own. */
export const usePointsEditorContext = get
export const setPointsEditorContext = set
