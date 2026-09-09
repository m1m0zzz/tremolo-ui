import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  clamp,
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
  toPrecision,
} from '@tremolo-ui/functions'

import { DEFAULT_DRAG_SENSITIVITY } from '../../input-event'
import { cssLength } from '../_util/css-length'
import { cx } from '../_util/cx'

import { Background } from './Background'
import { Container } from './Container'
import {
  type Marquee,
  type PointRegistration,
  PointsEditorProvider,
} from './context'
import { Point, type PointBaseType } from './Point'

/** One array for every editor with selection turned off, so memos hold still. */
const EMPTY: readonly string[] = []

/**
 * How far a point may move before something in the selection leaves its range.
 *
 * Clamping each point on its own would break the shape of the selection: the
 * one that reached the edge would stop while the rest carried on. One amount
 * for all of them means the whole selection stops together.
 */
function allowedDelta(
  delta: PointBaseType,
  entries: { start: PointBaseType; registration: PointRegistration }[],
): PointBaseType {
  let loX = -Infinity
  let hiX = Infinity
  let loY = -Infinity
  let hiY = Infinity

  for (const { start, registration } of entries) {
    loX = Math.max(loX, (registration.min?.x ?? 0) - start.x)
    hiX = Math.min(hiX, (registration.max?.x ?? 1) - start.x)
    loY = Math.max(loY, (registration.min?.y ?? 0) - start.y)
    hiY = Math.min(hiY, (registration.max?.y ?? 1) - start.y)
  }

  // A point that started outside its own range leaves nothing to move within.
  return {
    x: hiX < loX ? 0 : clamp(delta.x, loX, hiX),
    y: hiY < loY ? 0 : clamp(delta.y, loY, hiY),
  }
}

/*
TODO:

- grid
*/

/**
 * A point moves over 0..1 in both axes, so a nudge of 0.01 crosses the editor
 * in a hundred steps whatever its pixel size.
 */
const DEFAULT_WHEEL: ModifierValue<InputEventOption> = ['normalized', 0.01]

/**
 * Shift is the fine-adjustment key everywhere else, so it is bound here too
 * — but only on the keyboard. On the wheel it already means the x axis, and
 * browsers hand shift+wheel over as horizontal scrolling anyway.
 */
const DEFAULT_KEYBOARD: ModifierValue<InputEventOption> = {
  default: ['normalized', 0.01],
  shift: ['normalized', 0.001],
}

export interface PointsEditorProps {
  /** Sets `--width`; the size the theme gives it stands when omitted. */
  width?: number | string
  /** Sets `--height`. */
  height?: number | string

  /**
   * Make the points unchangeable and remove them from the tab order.
   * aria-disabled property is also applied.
   */
  disabled?: boolean
  /**
   * Make the points unmovable.
   * aria-readonly property is also applied.
   */
  readonly?: boolean

  /** CSS cursor applied while dragging a point. */
  externalStyles?: {
    cursor?: CSSProperties['cursor']
  }

  /**
   * wheel control option for every `Point`. Scrolling sideways moves x,
   * which is what a browser turns shift+wheel into.
   * If null, no event will be triggered
   *
   * A `Point` can override it with a `wheel` of its own.
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much one arrow key press moves a `Point`.
   *
   * Shift moves a tenth of the default amount. Name a modifier to change that,
   * or pass a bare tuple to use no modifier at all.
   *
   * If null, no event will be triggered.
   * A `Point` can override it with a `keyboard` of its own.
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
   * on empty space starts a rubber band rather than doing nothing, and a drag
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
      width,
      height,
      disabled = false,
      readonly = false,
      wheel = DEFAULT_WHEEL,
      keyboard = DEFAULT_KEYBOARD,
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
    const controlled = selectionProp !== undefined
    const [ownSelection, setOwnSelection] = useState<string[]>(
      defaultSelection ?? [],
    )
    // Nothing is selected while selection is off, so a drag picks up only the
    // point it started on and `data-selected` never turns on.
    const selection = selectable ? (selectionProp ?? ownSelection) : EMPTY

    // Drags read the selection from a native event handler, which runs after
    // the commit, so a ref is current by the time it matters.
    const selectionRef = useRef(selection)
    const changeHandlerRef = useRef(onSelectionChange)
    useEffect(() => {
      selectionRef.current = selection
      changeHandlerRef.current = onSelectionChange
    })

    const changeSelection = useCallback(
      (next: string[]) => {
        selectionRef.current = next
        if (!controlled) setOwnSelection(next)
        changeHandlerRef.current?.(next)
      },
      [controlled],
    )

    /**
     * Every mounted point, by id. A registration is a ref rather than a value:
     * the value inside changes on every frame of a drag, and a registry keyed
     * on it would be rebuilt just as often.
     */
    const points = useRef(new Map<string, RefObject<PointRegistration>>())

    const registerPoint = useCallback(
      (id: string, entry: RefObject<PointRegistration>) => {
        points.current.set(id, entry)
        return () => {
          points.current.delete(id)
        }
      },
      [],
    )

    /** What the current drag picked up, and where those points started. */
    const dragRef = useRef<{ id: string; start: PointBaseType }[]>([])

    const snapshot = useCallback((ids: readonly string[]) => {
      return ids.flatMap((id) => {
        const registration = points.current.get(id)?.current
        return registration ? [{ id, start: { ...registration.value } }] : []
      })
    }, [])

    const applyDeltaTo = useCallback(
      (
        entries: { id: string; start: PointBaseType }[],
        delta: PointBaseType,
      ) => {
        const withRegistration = entries.flatMap((entry) => {
          const registration = points.current.get(entry.id)?.current
          return registration ? [{ ...entry, registration }] : []
        })
        const allowed = allowedDelta(delta, withRegistration)
        for (const { start, registration } of withRegistration) {
          if (registration.readonly) continue
          // Rounded here as well as in the pipeline: a move is a subtraction
          // and an addition of its own, and that is enough to put the binary
          // artefact back (0.2 + 0.1 lands on 0.30000000000000004).
          registration.onChange?.({
            x: toPrecision(start.x + allowed.x),
            y: toPrecision(start.y + allowed.y),
          })
        }
      },
      [],
    )

    const beginPointDrag = useCallback(
      (id: string, modifiers: ModifierState) => {
        if (!selectable) {
          dragRef.current = snapshot([id])
          return
        }
        const current = selectionRef.current
        // Ctrl / meta rather than shift: shift is the fine-adjustment key on
        // every control here, and it cannot be both.
        const additive = modifiers.ctrlKey || modifiers.metaKey
        let next: readonly string[]
        if (additive) {
          next = current.includes(id)
            ? current.filter((x) => x !== id)
            : [...current, id]
        } else if (current.includes(id)) {
          // Already part of a group: keep it, so the group can be dragged.
          next = current
        } else {
          next = [id]
        }
        changeSelection([...next])
        // A press that took the point out of the selection was a deselect, not
        // the start of a move, so there is nothing to drag.
        dragRef.current = next.includes(id) ? snapshot(next) : []
      },
      [selectable, changeSelection, snapshot],
    )

    const movePointDrag = useCallback(
      (delta: PointBaseType) => applyDeltaTo(dragRef.current, delta),
      [applyDeltaTo],
    )

    const nudgeSelection = useCallback(
      (id: string, delta: PointBaseType) => {
        // From wherever the points are now: a key press is not a drag, so
        // there is no earlier position to measure against.
        const ids = selectionRef.current.includes(id)
          ? selectionRef.current
          : [id]
        applyDeltaTo(snapshot(ids), delta)
      },
      [applyDeltaTo, snapshot],
    )

    // --- rubber band ---
    const [marquee, setMarquee] = useState<Marquee | null>(null)
    const marqueeRef = useRef<{
      from: PointBaseType
      to: PointBaseType
      base: readonly string[]
    } | null>(null)

    const marqueeOf = (from: PointBaseType, to: PointBaseType): Marquee => ({
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
    })

    const applyMarquee = useCallback(
      (rect: Marquee, base: readonly string[]) => {
        const inside: string[] = []
        for (const [id, entry] of points.current) {
          const { x, y } = entry.current.value
          if (
            x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height
          ) {
            inside.push(id)
          }
        }
        changeSelection([...base, ...inside.filter((id) => !base.includes(id))])
      },
      [changeSelection],
    )

    const beginMarquee = useCallback(
      (at: PointBaseType, modifiers: ModifierState) => {
        if (!selectable) return
        const additive = modifiers.ctrlKey || modifiers.metaKey
        marqueeRef.current = {
          from: at,
          to: at,
          base: additive ? selectionRef.current : [],
        }
        setMarquee(marqueeOf(at, at))
        if (!additive) changeSelection([])
      },
      [selectable, changeSelection],
    )

    const moveMarquee = useCallback(
      (to: PointBaseType) => {
        const state = marqueeRef.current
        if (!state) return
        state.to = to
        const rect = marqueeOf(state.from, to)
        setMarquee(rect)
        applyMarquee(rect, state.base)
      },
      [applyMarquee],
    )

    const endMarquee = useCallback(() => {
      marqueeRef.current = null
      setMarquee(null)
    }, [])

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
        registerPoint,
        beginPointDrag,
        movePointDrag,
        nudgeSelection,
        marquee,
        beginMarquee,
        moveMarquee,
        endMarquee,
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
        registerPoint,
        beginPointDrag,
        movePointDrag,
        nudgeSelection,
        marquee,
        beginMarquee,
        moveMarquee,
        endMarquee,
      ],
    )

    return (
      <PointsEditorProvider value={context}>
        <div
          ref={forwardedRef}
          className={cx('tremolo-points-editor', className)}
          aria-disabled={disabled}
          aria-readonly={readonly}
          style={
            {
              '--width': cssLength(width),
              '--height': cssLength(height),
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
}

export {
  usePointsEditorContext,
  type PointsEditorContextValue,
} from './context'
export { type PointsEditorBackgroundProps } from './Background'
export { type PointsEditorContainerProps } from './Container'
export { clampPoint, type PointBaseType, type PointProps } from './Point'
