import {
  ComponentPropsWithoutRef,
  CSSProperties,
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
import { useWheel } from '../../hooks/useWheel'
import { cssLength } from '../_util/css-length'
import { cx } from '../_util/cx'
import { useCheckPlacement } from '../_util/placement'
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

  /** Accessible names for the x and y range inputs. */
  ariaLabels?: Partial<Record<'x' | 'y', string>>

  onChange?: (value: PointBaseType) => void
  onDragStart?: (value: PointBaseType) => void
  onDragEnd?: (value: PointBaseType) => void
}

/**
 * A point is placed by its position within the container, so its value is a
 * position: 0..1 on each axis, with y growing downwards.
 */
const AXIS = { min: 0, max: 1 }

export function Point<T extends PointBaseType>({
  value,
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
  ariaLabels = { x: 'x', y: 'y' },

  onChange,
  onDragStart,
  onDragEnd,

  className,
  style,
  onPointerDown,
  onKeyDown,
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
  })
  useEffect(() => {
    registration.current = { value, min, max, readonly: inactive, onChange }
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

  // The listener sits on the container rather than on the point: a wheel event
  // only reaches what the cursor is over, and a point is a 16px target. Every
  // point sees the event and the focused one acts, so the wheel works anywhere
  // over the editor, the way it does for Slider and XYPad.
  //
  // Each point only matches focus within its own two range inputs. Testing the
  // point wrapper keeps both axes connected to the same wheel interaction.
  useWheel(
    (event) => {
      if (!onChange || inactive || !wheel) return
      if (!element || !element.contains(element.ownerDocument.activeElement))
        return
      event.preventDefault()
      // Scrolling up moves the point towards y = 0; shift switches to x.
      // Browsers turn shift+wheel into horizontal scrolling: `deltaY` comes
      // out empty and `deltaX` carries the movement. Reading whichever axis
      // moved keeps shift working as the x-axis modifier — and picks up a
      // trackpad's own horizontal gesture, which never had a modifier.
      const horizontal = event.deltaX !== 0
      const delta = horizontal ? event.deltaX : event.deltaY
      if (delta === 0) return
      const axis = horizontal || event.shiftKey ? 'x' : 'y'
      const direction = delta < 0 ? -1 : 1
      nudge(axis, direction, wheel, event)
    },
    { target: containerRef },
  )

  const refCallback = useComposedRefs<HTMLDivElement>(
    dragRefCallback,
    setElement,
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key))
      return
    const inputAxis = (event.target as HTMLElement).dataset.axis
    const axis =
      inputAxis === 'x' || inputAxis === 'y'
        ? inputAxis
        : key === 'ArrowRight' || key === 'ArrowLeft'
          ? 'x'
          : 'y'
    const matchesAxis =
      inputAxis === undefined ||
      (axis === 'x' && (key === 'ArrowRight' || key === 'ArrowLeft')) ||
      (axis === 'y' && (key === 'ArrowUp' || key === 'ArrowDown'))
    event.preventDefault()
    if (!matchesAxis || !onChange || inactive || !keyboard) return
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
      aria-disabled={disabled}
      aria-readonly={readonly}
      data-dragging={dragging}
      data-selected={selected}
      style={
        {
          '--color': color,
          '--width': cssLength(size ?? width),
          '--height': cssLength(size ?? height),
          // Where the point is: the value, not a style.
          left: `${value.x * 100}%`,
          top: `${value.y * 100}%`,
          ...style,
        } as CSSProperties
      }
      onPointerDown={onPointerDown}
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
          aria-label={ariaLabels[axis] ?? axis}
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
    </div>
  )
}
