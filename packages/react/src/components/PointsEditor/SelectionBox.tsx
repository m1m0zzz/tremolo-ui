import { ComponentPropsWithoutRef, CSSProperties } from 'react'

import { useCheckPlacement } from '../_util/Placement'

import { usePointsEditorContext } from './context'

import type { CSSVariables } from '../../css-variables'

/**
 * The box a drag on empty space draws, and what it covers is selected.
 *
 * Nothing is rendered while no drag is running, and leaving it out leaves the
 * editor without one — the selection still works, it just cannot be seen.
 */
export function SelectionBox({
  children,
  className,
  style,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'style'> & {
  style?: CSSProperties & CSSVariables
}) {
  useCheckPlacement('PointsEditor.SelectionBox', 'PointsEditor.Container')

  const selectionBox = usePointsEditorContext((s) => s.selectionBox)
  if (!selectionBox) return null

  return (
    <div
      className={className}
      {...props}
      style={
        {
          // Drawn over the points while a drag runs, and taking none of the
          // pointer: the drag underneath is what it is reporting on.
          position: 'absolute',
          zIndex: 20,
          pointerEvents: 'none',
          ...style,
          // Where the box is and how big it is: the drag, not a style, so it
          // is written after whatever the caller passed.
          left: `${selectionBox.x * 100}%`,
          top: `${selectionBox.y * 100}%`,
          width: `${selectionBox.width * 100}%`,
          height: `${selectionBox.height * 100}%`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
