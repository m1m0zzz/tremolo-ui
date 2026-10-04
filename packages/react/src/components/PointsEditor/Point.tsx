import {
  ComponentPropsWithoutRef,
  CSSProperties,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import {
  arrowKeyMove,
  type ChangeSource,
  clampPoint,
  type InputEventOption,
  type ModifierValue,
  POINT_AXIS,
  type PointPosition,
  type PointsEditorPoint,
  selectModifier,
} from '@tremolo-ui/dom'

import { useComposedRefs } from '../../compose-refs'
import { useChangeGesture } from '../../hooks/_internal/useChangeGesture'
import { useDragValue } from '../../hooks/useDragValue'
import { useCheckPlacement } from '../_util/Placement'
import { VisuallyHiddenRangeInput } from '../_util/VisuallyHiddenRangeInput'

import { usePointsEditorContext } from './context'

import type { CSSVariables } from '../../css-variables'

export interface PointsEditorPointProps<T extends PointPosition> {
  /**
   * Where the point is, as `{ x, y }` from 0 to 1 on each axis, with `y`
   * growing downwards.
   */
  value: T
  /**
   * How the selection refers to this point. One is generated when it is left
   * out, which lasts as long as the point is mounted — give your own if the
   * selection has to survive a remount, or be recognised in your own state.
   */
  id?: string
  /** The lowest position the point can take, per axis. An axis left out is 0. */
  min?: Partial<PointPosition>
  /** The highest position the point can take, per axis. An axis left out is 1. */
  max?: Partial<PointPosition>

  /** Sets `--color`, for the theme to colour the point with. */
  color?: string

  /** Overrides the `disabled` of `PointsEditor.Root`. */
  disabled?: boolean
  /** Overrides the `readOnly` of `PointsEditor.Root`. */
  readOnly?: boolean

  /** Overrides the `wheel` of `PointsEditor.Root`. */
  wheel?: ModifierValue<InputEventOption> | null
  /** Overrides the `keyboard` of `PointsEditor.Root`. */
  keyboard?: ModifierValue<InputEventOption> | null

  /**
   * The accessible name of each axis. There are two range inputs inside the
   * point, so this takes one name per axis; a single string names them both.
   */
  'aria-label'?: string | Partial<Record<'x' | 'y', string>>
  /** What the value of each axis means, when the number does not say it. */
  'aria-valuetext'?: string | Partial<Record<'x' | 'y', string>>

  /**
   * Called with the new position when the point is dragged or moved by the
   * arrow keys or the wheel, including when it moves along with a selection.
   */
  onChange?: (value: PointPosition) => void
  /**
   * Called when a change of this point starts — a drag on it, the first wheel
   * notch or arrow key while it has the focus — with where it is and what the
   * change is made with. The points that move along with a selection report
   * through `onChange` only: the change belongs to the point being operated.
   */
  onChangeStart?: (value: PointPosition, source: ChangeSource) => void
  /**
   * Called when that change ends, with where the point is: on release, or
   * `changeEndDelay` after the last wheel notch or arrow key.
   */
  onChangeEnd?: (value: PointPosition, source: ChangeSource) => void
  /**
   * How long after the last wheel notch or arrow key the change counts as
   * over, in milliseconds. Neither has an event that says it is done.
   *
   * @default 500
   */
  changeEndDelay?: number

  style?: CSSProperties & CSSVariables<'color' | 'translate'>
}

/**
 * One setting for both axes, or one per axis. The point holds a range input
 * for each, so anything that names or describes it comes in a pair.
 */
function perAxis(
  value: string | Partial<Record<'x' | 'y', string>> | undefined,
  axis: 'x' | 'y',
) {
  return typeof value === 'string' ? value : value?.[axis]
}

export function Point<T extends PointPosition>({
  value,
  children,
  id: idProp,
  min,
  max,
  color,

  disabled: _disabled,
  readOnly: _readOnly,
  wheel: _wheel,
  keyboard: _keyboard,
  'aria-label': ariaLabel,
  'aria-valuetext': ariaValuetext,

  onChange,
  onChangeStart,
  onChangeEnd,
  changeEndDelay,

  className,
  style,
  onPointerDown,
  onKeyDown,
  onFocus,
  ...props
}: PointsEditorPointProps<T> &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorPointProps<T>>) {
  const {
    containerRef,
    dragCursor,
    disabled: rootDisabled,
    readOnly: rootReadOnly,
    wheel: rootWheel,
    keyboard: rootKeyboard,
    dragSensitivity,
    selection,
    editor,
  } = usePointsEditorContext()

  const generatedId = useId()
  const id = idProp ?? generatedId
  const selected = selection.includes(id)

  const disabled = _disabled ?? rootDisabled
  const readOnly = _readOnly ?? rootReadOnly
  const inactive = disabled || readOnly
  // `null` means "no event" and has to survive the fallback, so `??` is not
  // enough: only an omitted prop inherits from the root.
  const wheel = _wheel === undefined ? rootWheel : _wheel
  const keyboard = _keyboard === undefined ? rootKeyboard : _keyboard

  useCheckPlacement('PointsEditor.Point', 'PointsEditor.Container')

  const current = clampPoint(value, min, max)
  const gesture = useChangeGesture(
    current,
    { onChangeStart, onChangeEnd, changeEndDelay },
    inactive,
  )
  // Every move reaches the point through here, whatever moved it, so the
  // last one is what `onChangeEnd` gives.
  const handleChange = (next: PointPosition) => {
    gesture.changed(next)
    onChange?.(next)
  }

  // Compared against the focus below, so the point needs its own element.
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const xInputRef = useRef<HTMLInputElement>(null)
  const yInputRef = useRef<HTMLInputElement>(null)

  // What the editor needs to move this point along with the rest of a
  // selection. Rewritten after every render rather than kept in the registry
  // itself: the value changes on every frame of a drag.
  const registration = useRef<PointsEditorPoint>({
    value,
    min,
    max,
    readonly: inactive,
    onChange: onChange ? handleChange : undefined,
    element,
    wheel,
    beforeWheel: () => gesture.pulse('wheel'),
  })
  useEffect(() => {
    registration.current = {
      value,
      min,
      max,
      readonly: inactive,
      onChange: onChange ? handleChange : undefined,
      element,
      wheel,
      beforeWheel: () => gesture.pulse('wheel'),
    }
  })

  useEffect(
    () => editor.registerPoint(id, () => registration.current),
    [id, editor],
  )

  /** Where the pointer was when the drag started, to measure the move from. */
  const pointerOrigin = useRef<PointPosition | null>(null)

  // The value is the position itself: no scaling, and no rounding to a step.
  const { refCallback: dragRefCallback, dragging } =
    useDragValue<HTMLDivElement>({
      axis: POINT_AXIS,
      baseElementRef: containerRef,
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
      cursor: inactive ? undefined : dragCursor,
      shouldStart: () => !disabled,
      // The value is a move rather than a position: the point keeps the offset
      // it was grabbed at, and everything else selected moves with it by the
      // same amount.
      onChange: ([x, y]) => {
        const origin = pointerOrigin.current
        if (!origin) return
        editor.movePointDrag({ x: x - origin.x, y: y - origin.y })
      },
      onDragStart: ([x, y], state) => {
        // The press decides the selection before the snapshot is taken, so it
        // happens here rather than in an onPointerDown: a native listener on
        // the element runs before React's, and the two would disagree.
        editor.beginPointDrag(id, state.event)
        pointerOrigin.current = { x, y }
        xInputRef.current?.focus()

        if (!inactive) gesture.hold('pointer')
      },
      onDragEnd: () => {
        pointerOrigin.current = null
        gesture.end()
      },
    })

  const refCallback = useComposedRefs<HTMLDivElement>(
    dragRefCallback,
    setElement,
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // The key picks the axis, whichever of the two inputs holds the focus:
    // the focus lands on the x input, so reading the axis off the input would
    // leave the y axis with no keys at all. y grows downwards, so ArrowUp
    // moves the point towards 0.
    const move = arrowKeyMove(event.key)
    if (!move) return
    event.preventDefault()
    if (!onChange || inactive || !keyboard) return
    gesture.pulse('keyboard')
    editor.nudgePoint(
      id,
      move.axis === 0 ? 'x' : 'y',
      move.direction,
      keyboard,
      event,
    )
  }

  return (
    // The visual point has two values, so its semantics live on the two range
    // inputs nested inside it rather than on this drag handle.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={refCallback}
      className={className}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly ? '' : undefined}
      // A press lands on the point, which cannot hold focus, and the browser
      // answers that by clearing the focus to the body — undoing the focus the
      // drag just gave the input. Taking the focus here keeps it inside, and
      // it is passed on to the input below.
      tabIndex={-1}
      data-dragging={dragging ? '' : undefined}
      data-selected={selected ? '' : undefined}
      style={
        {
          '--color': color,
          // The mechanics of the position below: a point is placed by its
          // position in the container, measured from its own centre.
          position: 'absolute',
          translate: 'var(--translate, -50% -50%)',
          ...style,
          // Where the point is: the value, not a style.
          left: `${value.x * 100}%`,
          top: `${value.y * 100}%`,
        } as CSSProperties
      }
      onPointerDown={onPointerDown}
      onFocus={(event) => {
        // The point itself is not the control: its semantics live on the
        // inputs, so whatever reaches it is handed to the first of them.
        if (!disabled && event.target === event.currentTarget) {
          xInputRef.current?.focus()
        }
        onFocus?.(event)
      }}
      onKeyDown={(event) => {
        handleKeyDown(event)
        onKeyDown?.(event)
      }}
      {...props}
    >
      {(['x', 'y'] as const).map((axis) => (
        <VisuallyHiddenRangeInput
          key={axis}
          ref={axis === 'x' ? xInputRef : yInputRef}
          data-axis={axis}
          value={current[axis]}
          min={min?.[axis] ?? 0}
          max={max?.[axis] ?? 1}
          step="any"
          disabled={disabled}
          aria-readonly={readOnly}
          aria-orientation={axis === 'x' ? 'horizontal' : 'vertical'}
          aria-label={perAxis(ariaLabel, axis) ?? axis}
          aria-valuetext={perAxis(ariaValuetext, axis)}
          onChange={(event) => {
            if (readOnly) {
              event.currentTarget.value = String(current[axis])
              return
            }
            const delta = event.currentTarget.valueAsNumber - value[axis]
            editor.nudgeSelection(id, {
              x: axis === 'x' ? delta : 0,
              y: axis === 'y' ? delta : 0,
            })
          }}
        />
      ))}
      {children}
    </div>
  )
}
