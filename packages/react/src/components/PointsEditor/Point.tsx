import clsx from 'clsx'
import { ComponentPropsWithoutRef } from 'react'

import { clamp } from '@tremolo-ui/functions'

import { useDragWithElement } from '../../hooks/useDragWithElement'
import { addNoSelect, removeNoSelect } from '../_util'

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

  disabled?: boolean
  readonly?: boolean

  onChange?: (value: PointBaseType) => void
  onDragStart?: (value: PointBaseType) => void
  onDragEnd?: (value: PointBaseType) => void
}

/** @category PointsEditor */
export function Point<T extends PointBaseType>({
  value,
  min,
  max,
  size,
  width = 16,
  height = 16,
  color,

  disabled,
  readonly,

  onChange,
  onDragStart,
  onDragEnd,

  className,
  style,
  onPointerDown,
  ...props
}: PointProps<T> & Omit<ComponentPropsWithoutRef<'div'>, keyof PointProps<T>>) {
  const containerElementRef = usePointsEditorContext(
    (s) => s.containerElementRef,
  )
  const bodyNoSelect = usePointsEditorContext((s) => s.bodyNoSelect)
  const __disabled = usePointsEditorContext((s) => s.disabled)
  const __readonly = usePointsEditorContext((s) => s.readonly)

  // console.log(value.x, value.y)

  // Piano: 値が更新されることで、イベントハンドラがリセットされる

  const {
    refHandler: touchMoveRefCallback,
    pointerDownHandler,
    dragging,
  } = useDragWithElement<HTMLDivElement>({
    baseElementRef: containerElementRef,
    onDrag: (x, y) => {
      if (readonly) return

      onChange?.(clampPoint({ x, y }, min, max))
    },
    onDragStart: (x, y) => {
      if (readonly) return
      if (bodyNoSelect) addNoSelect()

      onDragStart?.(clampPoint({ x, y }, min, max))
    },
    onDragEnd: (x, y) => {
      if (readonly) return
      if (bodyNoSelect) removeNoSelect()

      onDragEnd?.(clampPoint({ x, y }, min, max))
    },
  })

  const colors: Record<string, string | undefined> = {
    '--color': color,
  }

  return (
    <div
      ref={(div) => {
        // wheelRefCallback(div)
        touchMoveRefCallback(div)
      }}
      className={clsx('tremolo-points-editor-point', className)}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-disabled={disabled != undefined ? disabled : __disabled}
      aria-readonly={readonly != undefined ? readonly : __readonly}
      data-dragging={dragging}
      style={{
        ...colors,
        width: size ?? width,
        height: size ?? height,
        left: `${value.x * 100}%`,
        top: `${value.y * 100}%`,
        ...style,
      }}
      onPointerDown={(event) => {
        pointerDownHandler(event)
        onPointerDown?.(event)
      }}
      {...props}
    />
  )
}
