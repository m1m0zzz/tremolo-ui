import clsx from 'clsx'
import { ComponentPropsWithoutRef, useCallback, useState } from 'react'

import { applyDelta, clamp, InputEventOption } from '@tremolo-ui/functions'

import { useDragValue } from '../../hooks/useDragValue'
import { useWheel } from '../../hooks/useWheel'
import { addUserSelectNone, removeUserSelectNone } from '../_util'
import { useComposedRefs } from '../_util/composeRefs'
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

  size?: number | string
  width?: number | string
  height?: number | string
  color?: string

  /** Overrides the `disabled` of `PointsEditor.Root`. */
  disabled?: boolean
  /** Overrides the `readonly` of `PointsEditor.Root`. */
  readonly?: boolean

  /** Overrides the `wheel` of `PointsEditor.Root`. */
  wheel?: InputEventOption | null
  /** Overrides the `keyboard` of `PointsEditor.Root`. */
  keyboard?: InputEventOption | null

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
  width = 16,
  height = 16,
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
    (axis: 'x' | 'y', direction: number, option: InputEventOption) => {
      const next = applyDelta(value[axis], direction, option, AXIS)
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
      const axis = event.shiftKey ? 'x' : 'y'
      const direction = event.deltaY < 0 ? -1 : 1
      nudge(axis, direction, wheel)
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
      nudge(axis, direction, keyboard)
    }
  }

  const colors: Record<string, string | undefined> = {
    '--color': color,
  }

  return (
    // The point is a drag handle rather than a control of a known kind: it has
    // no single value to announce, so there is no role that fits it.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={refCallback}
      className={clsx('tremolo-points-editor-point', className)}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-disabled={disabled}
      aria-readonly={readonly}
      data-dragging={dragging}
      style={{
        ...colors,
        width: size ?? width,
        height: size ?? height,
        left: `${value.x * 100}%`,
        top: `${value.y * 100}%`,
        ...style,
      }}
      onPointerDown={onPointerDown}
      onKeyDown={(event) => {
        handleKeyDown(event)
        onKeyDown?.(event)
      }}
      {...props}
    />
  )
}
