import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import {
  applyDelta,
  clamp,
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
  selectModifier,
} from '@tremolo-ui/functions'

import { useComposedRefs } from '../../compose-refs'
import { useDragValue } from '../../hooks/useDragValue'
import { cssLength } from '../_util/css-length'
import { cx } from '../_util/cx'
import { useCheckPlacement } from '../_util/Placement'
import { VisuallyHiddenRangeInput } from '../_util/VisuallyHiddenRangeInput'

import { type PointRegistration, usePointsEditorContext } from './context'

export type PointBaseType = { x: number; y: number }

export function clampPoint(
  point: PointBaseType,
  min?: Partial<PointBaseType>,
  max?: Partial<PointBaseType>,
) {
  const { x, y } = point
  const newX = clamp(x, min?.x ?? 0, max?.x ?? 1)
  const newY = clamp(y, min?.y ?? 0, max?.y ?? 1)
  return { x: newX, y: newY }
}

export interface PointProps<T extends PointBaseType> {
  value: T
  /** Drawn inside the point: the theme's own dot stands when it is left out. */
  children?: ReactNode
  /**
   * How the selection refers to this point. One is generated when it is left
   * out, which lasts as long as the point is mounted — give your own if the
   * selection has to survive a remount, or be recognised in your own state.
   */
  id?: string
  min?: Partial<PointBaseType>
  max?: Partial<PointBaseType>

  /** Width and height at once. Sets both `--width` and `--height`. */
  size?: number | string
  /** Sets `--width`; the size the theme gives it stands when omitted. */
  width?: number | string
  /** Sets `--height`. */
  height?: number | string
  /** Sets `--color`. */
  color?: string

  /** Overrides the `disabled` of `PointsEditor.Root`. */
  disabled?: boolean
  /** Overrides the `readonly` of `PointsEditor.Root`. */
  readonly?: boolean

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

  onChange?: (value: PointBaseType) => void
  onDragStart?: (value: PointBaseType) => void
  onDragEnd?: (value: PointBaseType) => void
}

/**
 * A point is placed by its position within the container, so its value is a
 * position: 0..1 on each axis, with y growing downwards.
 */
export const AXIS = { min: 0, max: 1 }

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

export function Point<T extends PointBaseType>({
  value,
  children,
  id: idProp,
  min,
  max,
  size,
  width,
  height,
  color,

  disabled: _disabled,
  readonly: _readonly,
  wheel: _wheel,
  keyboard: _keyboard,
  'aria-label': ariaLabel,
  'aria-valuetext': ariaValuetext,

  onChange,
  onDragStart,
  onDragEnd,

  className,
  style,
  onPointerDown,
  onKeyDown,
  onFocus,
  ...props
}: PointProps<T> & Omit<ComponentPropsWithoutRef<'div'>, keyof PointProps<T>>) {
  const {
    containerRef,
    externalStyles,
    disabled: rootDisabled,
    readonly: rootReadonly,
    wheel: rootWheel,
    keyboard: rootKeyboard,
    dragSensitivity,
    selection,
    registerPoint,
    beginPointDrag,
    movePointDrag,
    nudgeSelection,
  } = usePointsEditorContext()

  const generatedId = useId()
  const id = idProp ?? generatedId
  const selected = selection.includes(id)

  const disabled = _disabled ?? rootDisabled
  const readonly = _readonly ?? rootReadonly
  const inactive = disabled || readonly
  // `null` means "no event" and has to survive the fallback, so `??` is not
  // enough: only an omitted prop inherits from the root.
  const wheel = _wheel === undefined ? rootWheel : _wheel
  const keyboard = _keyboard === undefined ? rootKeyboard : _keyboard

  useCheckPlacement('PointsEditor.Point', 'PointsEditor.Container')

  // Compared against the focus below, so the point needs its own element.
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const xInputRef = useRef<HTMLInputElement>(null)
  const yInputRef = useRef<HTMLInputElement>(null)

  // What the editor needs to move this point along with the rest of a
  // selection. Rewritten after every render rather than kept in the registry
  // itself: the value changes on every frame of a drag.
  const registration = useRef<PointRegistration>({
    value,
    min,
    max,
    readonly: inactive,
    onChange,
    element,
    wheel,
  })
  useEffect(() => {
    registration.current = {
      value,
      min,
      max,
      readonly: inactive,
      onChange,
      element,
      wheel,
    }
  })

  useEffect(() => registerPoint(id, registration), [id, registerPoint])

  /** Where the pointer was when the drag started, to measure the move from. */
  const pointerOrigin = useRef<PointBaseType | null>(null)

  // The value is the position itself: no scaling, and no rounding to a step.
  const { refCallback: dragRefCallback, dragging } =
    useDragValue<HTMLDivElement>({
      axis: AXIS,
      baseElementRef: containerRef,
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
      cursor: inactive ? undefined : externalStyles.cursor,
      shouldStart: () => !disabled,
      // The value is a move rather than a position: the point keeps the offset
      // it was grabbed at, and everything else selected moves with it by the
      // same amount.
      onChange: ([x, y]) => {
        const origin = pointerOrigin.current
        if (!origin) return
        movePointDrag({ x: x - origin.x, y: y - origin.y })
      },
      onDragStart: ([x, y], state) => {
        // The press decides the selection before the snapshot is taken, so it
        // happens here rather than in an onPointerDown: a native listener on
        // the element runs before React's, and the two would disagree.
        beginPointDrag(id, state.event)
        pointerOrigin.current = { x, y }
        xInputRef.current?.focus()

        if (inactive) return
        onDragStart?.(clampPoint(value, min, max))
      },
      onDragEnd: () => {
        pointerOrigin.current = null

        if (inactive) return
        onDragEnd?.(clampPoint(value, min, max))
      },
    })

  const nudge = useCallback(
    (
      axis: 'x' | 'y',
      direction: number,
      option: ModifierValue<InputEventOption>,
      modifiers: ModifierState,
    ) => {
      const next = applyDelta(value[axis], direction, option, AXIS, modifiers)
      // As a move, so that the rest of the selection comes along and the whole
      // group stops together at the edge.
      nudgeSelection(id, {
        x: axis === 'x' ? next - value.x : 0,
        y: axis === 'y' ? next - value.y : 0,
      })
    },
    [value, id, nudgeSelection],
  )

  const refCallback = useComposedRefs<HTMLDivElement>(
    dragRefCallback,
    setElement,
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key))
      return
    // The key picks the axis, whichever of the two inputs holds the focus: a
    // point is one control to the person moving it, and the focus lands on the
    // x input, so reading the axis off the input would leave the y axis with
    // no keys at all.
    const axis = key === 'ArrowRight' || key === 'ArrowLeft' ? 'x' : 'y'
    event.preventDefault()
    if (!onChange || inactive || !keyboard) return
    // y grows downwards, so ArrowUp moves the point towards 0.
    const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1
    nudge(axis, direction, keyboard, event)
  }

  const current = clampPoint(value, min, max)

  return (
    // The visual point has two values, so its semantics live on the two range
    // inputs nested inside it rather than on this drag handle.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={refCallback}
      className={cx('tremolo-points-editor-point', className)}
      data-disabled={disabled || undefined}
      data-readonly={readonly || undefined}
      // A press lands on the point, which cannot hold focus, and the browser
      // answers that by clearing the focus to the body — undoing the focus the
      // drag just gave the input. Taking the focus here keeps it inside, and
      // it is passed on to the input below.
      tabIndex={-1}
      data-dragging={dragging || undefined}
      data-selected={selected || undefined}
      style={
        {
          '--color': color,
          '--width': cssLength(size ?? width),
          '--height': cssLength(size ?? height),
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
          className={`tremolo-points-editor-${axis}-input`}
          data-axis={axis}
          value={current[axis]}
          min={min?.[axis] ?? 0}
          max={max?.[axis] ?? 1}
          step="any"
          disabled={disabled}
          aria-readonly={readonly}
          aria-orientation={axis === 'x' ? 'horizontal' : 'vertical'}
          aria-label={perAxis(ariaLabel, axis) ?? axis}
          aria-valuetext={perAxis(ariaValuetext, axis)}
          onChange={(event) => {
            if (readonly) {
              event.currentTarget.value = String(current[axis])
              return
            }
            const delta = event.currentTarget.valueAsNumber - value[axis]
            nudgeSelection(id, {
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
