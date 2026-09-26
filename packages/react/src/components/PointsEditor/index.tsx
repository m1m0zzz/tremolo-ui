import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  createPointsEditor,
  DEFAULT_DRAG_SENSITIVITY,
  type InputEventOption,
  type ModifierValue,
  POINTS_EDITOR_DEFAULT_KEYBOARD,
  POINTS_EDITOR_DEFAULT_WHEEL,
  type SelectionBoxRect,
} from '@tremolo-ui/dom'

import { Background } from './Background'
import { Container } from './Container'
import { PointsEditorProvider } from './context'
import { Point } from './Point'
import { SelectionBox } from './SelectionBox'

/** One array for every editor with selection turned off, so memos hold still. */
const EMPTY: readonly string[] = []

export interface PointsEditorProps {
  /**
   * Make the points unchangeable and remove them from the tab order.
   * The parts carry `data-disabled` while it is set.
   */
  disabled?: boolean
  /**
   * Make the points unmovable.
   * The parts carry `data-readonly` while it is set.
   */
  readonly?: boolean

  /**
   * The cursor to show while dragging a point. It is set on the dragged
   * point, so it stays while the pointer is outside it.
   *
   * @default { cursor: 'grabbing' }
   */
  externalStyles?: {
    cursor?: CSSProperties['cursor']
  }

  /**
   * How much one notch of the wheel moves the focused `Point`. Scrolling
   * sideways, or with shift held, moves x; otherwise it moves y.
   *
   * A position runs from 0 to 1, so `['normalized', n]` and `['raw', n]` both
   * move it by `n` of the editor. `null` turns the wheel off, and a `Point`
   * can override it with a `wheel` of its own.
   *
   * @default ['normalized', 0.01]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much one arrow key press moves a `Point`. Left and right move x, up
   * and down move y.
   *
   * A position runs from 0 to 1, so `['normalized', n]` and `['raw', n]` both
   * move it by `n` of the editor; give a map to set an amount per modifier
   * key. `null` turns the arrow keys off, and a `Point` can override it with a
   * `keyboard` of its own.
   *
   * @default { default: ['normalized', 0.01], shift: ['normalized', 0.001] }
   */
  keyboard?: ModifierValue<InputEventOption> | null

  /**
   * How much a drag moves a `Point`, per modifier key.
   *
   * `1` is the pointer position itself, which is what dragging a point
   * normally is. **Anything else turns the drag relative**: `0.1` makes the
   * same movement cover a tenth of the editor, so the point stops following
   * the pointer and starts moving a tenth as fast. Shift is bound to `0.1` by
   * default, to match what it does on the arrow keys.
   *
   * Pressing or releasing the key mid-drag does not disturb the point: the
   * travel so far is kept and the new sensitivity applies from there. **The
   * pointer and the point stay apart for the rest of the drag** — snapping
   * them back together on release would move the point nobody asked to move.
   *
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>

  /**
   * Let points be selected, and a selection be moved as one.
   *
   * Off by default, because it changes what a press and a drag mean: a press
   * on empty space starts a selection box rather than doing nothing, and a drag
   * on a point moves everything else that is selected. An editor whose points
   * each mean something different — the four handles of an ADSR envelope, say
   * — has nothing to gain from moving them together.
   *
   * **A selection calls `onChange` on several points in the same tick**, so
   * each of them has to update from the previous state rather than from a
   * value captured in the render:
   *
   * ```jsx
   * onChange={(v) => setPoints((prev) => ({ ...prev, [id]: v }))}
   * ```
   *
   * Written the other way round — `setPoints({ ...points, [id]: v })` — every
   * call but the last is thrown away, and only one point appears to move.
   *
   * @default false
   */
  selectable?: boolean

  /**
   * Ids of the selected points, to hold the selection yourself. Leave it out
   * and the editor keeps its own.
   *
   * A `Point` takes its id from its `id` prop, or generates one that lasts as
   * long as it is mounted.
   */
  selection?: string[]
  /** The selection to start with, when the editor keeps its own. */
  defaultSelection?: string[]
  /** Called whenever the selection changes, controlled or not. */
  onSelectionChange?: (selection: string[]) => void

  /**
   * The editor renders exactly what you compose here; there is no default
   * markup to fall back to.
   *
   * @example
   * <PointsEditor.Root>
   *   <PointsEditor.Background>
   *     <svg viewBox="0 0 200 100">...</svg>
   *   </PointsEditor.Background>
   *   <PointsEditor.Container>
   *     {points.map((point, i) => (
   *       <PointsEditor.Point key={i} value={point} onChange={...} />
   *     ))}
   *   </PointsEditor.Container>
   * </PointsEditor.Root>
   */
  children: ReactNode
}

type Props = PointsEditorProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorProps>

export const Root = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  (
    {
      disabled = false,
      readonly = false,
      wheel = POINTS_EDITOR_DEFAULT_WHEEL,
      keyboard = POINTS_EDITOR_DEFAULT_KEYBOARD,
      dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
      selectable = false,
      selection: selectionProp,
      defaultSelection,
      onSelectionChange,
      externalStyles,
      style,
      className,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    // Picked apart so that the memo below depends on values rather than on the
    // object literal a caller writes inline, which is new on every render.
    const { cursor = 'grabbing' } = externalStyles ?? {}

    // --- selection ---
    // The selection lives here, where React state can hold it; which points a
    // press or a box selects, and how a selection moves, is the core's.
    const controlled = selectionProp !== undefined
    const [ownSelection, setOwnSelection] = useState<string[]>(
      defaultSelection ?? [],
    )
    // Nothing is selected while selection is off, so a drag picks up only the
    // point it started on and `data-selected` never turns on.
    const selection = selectable ? (selectionProp ?? ownSelection) : EMPTY

    const [selectionBox, setSelectionBox] = useState<SelectionBoxRect | null>(
      null,
    )

    const [editor] = useState(() =>
      createPointsEditor({ onSelectionBoxChange: setSelectionBox }),
    )

    // Drags read the selection from a native event handler, which runs after
    // the commit, so pushing it from an effect is current by the time it
    // matters. The handler goes the same way: it closes over this render.
    useEffect(() => {
      editor.update({
        selectable,
        selection,
        onSelectionChange: (next) => {
          if (!controlled) setOwnSelection(next)
          onSelectionChange?.(next)
        },
      })
    })

    useEffect(() => () => editor.destroy(), [editor])

    const context = useMemo(
      () => ({
        disabled,
        readonly,
        wheel,
        keyboard,
        dragSensitivity,
        externalStyles: { cursor },
        containerRef,
        selectable,
        selection,
        editor,
        selectionBox,
      }),
      [
        disabled,
        readonly,
        wheel,
        keyboard,
        dragSensitivity,
        cursor,
        selectable,
        selection,
        editor,
        selectionBox,
      ],
    )

    return (
      <PointsEditorProvider value={context}>
        <div
          ref={forwardedRef}
          className={className}
          data-disabled={disabled ? '' : undefined}
          data-readonly={readonly ? '' : undefined}
          style={
            {
              // The layers inside are placed against this box.
              position: 'relative',
              ...style,
            } as CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </PointsEditorProvider>
    )
  },
)

/**
 * Multiple Point Controller
 */
export const PointsEditor = {
  Root,
  Background,
  Container,
  Point,
  SelectionBox,
}

export {
  usePointsEditorContext,
  type PointsEditorContextValue,
} from './context'
export { type PointsEditorPointProps } from './Point'
