import {
  ComponentPropsWithoutRef,
  CSSProperties,
  useCallback,
  useState,
} from 'react'

import {
  applyDelta,
  clamp,
  type InputEventOptions,
  type ModifierState,
  selectModifier,
} from '@tremolo-ui/functions'

import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { addUserSelectNone, removeUserSelectNone } from '../_util'
import { useComposedRefs } from '../_util/composeRefs'
import { cssLength } from '../_util/cssLength'
import { cx } from '../_util/cx'
import { useCheckPlacement } from '../_util/placement'

import { usePointsEditorContext } from './context'

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
  wheel?: InputEventOptions | null
  /** Overrides the `keyboard` of `PointsEditor.Root`. */
  keyboard?: InputEventOptions | null

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
  } = usePointsEditorContext()

  const disabled = _disabled ?? rootDisabled
  const readonly = _readonly ?? rootReadonly
  // `null` means "no event" and has to survive the fallback, so `??` is not
  // enough: only an omitted prop inherits from the root.
  const wheel = _wheel === undefined ? rootWheel : _wheel
  const keyboard = _keyboard === undefined ? rootKeyboard : _keyboard

  useCheckPlacement('PointsEditor.Point', 'PointsEditor.Container')

  // Compared against the focus below, so the point needs its own element.
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  // The value is the position itself: no scaling, and no rounding to a step.
  const { refCallback: dragRefCallback, dragging } =
    useDragValue<HTMLDivElement>({
      axis: AXIS,
      baseElementRef: containerRef,
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
      cursor: readonly ? undefined : externalStyles.cursor,
      onChange: ([x, y]) => {
        if (readonly) return

        onChange?.(clampPoint({ x, y }, min, max))
      },
      onDragStart: ([x, y]) => {
        if (readonly) return
        if (externalStyles.userSelectNone) addUserSelectNone()

        onDragStart?.(clampPoint({ x, y }, min, max))
      },
      onDragEnd: ([x, y]) => {
        if (readonly) return
        if (externalStyles.userSelectNone) removeUserSelectNone()

        onDragEnd?.(clampPoint({ x, y }, min, max))
      },
    })

  const nudge = useCallback(
    (
      axis: 'x' | 'y',
      direction: number,
      option: InputEventOptions,
      modifiers: ModifierState,
    ) => {
      const next = applyDelta(value[axis], direction, option, AXIS, modifiers)
      onChange?.(clampPoint({ ...value, [axis]: next }, min, max))
    },
    [value, min, max, onChange],
  )

  // The listener sits on the container rather than on the point: a wheel event
  // only reaches what the cursor is over, and a point is a 16px target. Every
  // point sees the event and the focused one acts, so the wheel works anywhere
  // over the editor, the way it does for Slider and XYPad.
  //
  // The focus test is an identity check, not `contains`: with `contains` every
  // point would match the container's focus and they would all move at once.
  useWheel(
    (event) => {
      if (!onChange || readonly || !wheel) return
      if (!element || element.ownerDocument.activeElement !== element) return
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
    if (!onChange || readonly || !keyboard) return
    const key = event.key
    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
      event.preventDefault()
      // y grows downwards, so ArrowUp moves the point towards 0.
      const axis = key === 'ArrowRight' || key === 'ArrowLeft' ? 'x' : 'y'
      const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1
      nudge(axis, direction, keyboard, event)
    }
  }

  return (
    // The point is a drag handle rather than a control of a known kind: it has
    // no single value to announce, so there is no role that fits it.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={refCallback}
      className={cx('tremolo-points-editor-point', className)}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-disabled={disabled}
      aria-readonly={readonly}
      data-dragging={dragging}
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
    />
  )
}
