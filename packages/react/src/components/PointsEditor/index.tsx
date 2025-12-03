import clsx from 'clsx'
import { ComponentPropsWithoutRef, forwardRef } from 'react'

import { InputEventOption } from '@tremolo-ui/functions'

import { Cursor } from '../_util'

import { Background } from './Background'
import { Container } from './Container'
import { PointsEditorProvider } from './context'
import { Point, PointBaseType } from './Point'

/*
TODO:

- 複数選択
- modifier
*/

/*
import { useState } from 'react'

export default function App() {
  const [points, setPoints] = useState(initialPoints)

  return (
    <PointsEditor.Root
      onDoubleClick={({ x, y }, _e) => {
        const newPoints = [...points, { x, y }]
        setPoints(newPoints)
      }}
    >
      {points.map((point) => (
        <PointsEditor.Point key={`${point.x}, ${point.y}`} value={point} />
      ))}
    </PointsEditor.Root>
  )
}
*/

const defaultExternalStyles: PointsEditorProps['externalStyles'] = {
  userSelectNone: true,
  cursor: 'grabbing',
}

/** @category PointsEditor */
export interface PointsEditorProps {
  width?: number | string
  height?: number | string

  // TODO
  grid?: number | PointBaseType
  // modifier?:

  disabled?: boolean
  readonly?: boolean

  externalStyles?: {
    userSelectNone?: boolean
    cursor?: Cursor
  }

  // TODO
  /**
   * wheel control option
   * If null, no event will be triggered
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   * If null, no event will be triggered
   */
  keyboard?: InputEventOption | null
}

type Props = PointsEditorProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorProps>

const Root = forwardRef<HTMLDivElement, Props>(
  (
    {
      width = 200,
      height = 100,
      disabled = false,
      readonly = false,
      externalStyles: _externalStyles,
      style,
      className,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const externalStyles = { ...defaultExternalStyles, ..._externalStyles }

    return (
      <PointsEditorProvider
        disabled={disabled}
        readonly={readonly}
        externalStyles={externalStyles}
      >
        <div
          ref={forwardedRef}
          className={clsx('tremolo-points-editor', className)}
          style={{
            width,
            height,
            ...style,
          }}
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
 * @category PointsEditor
 */
export const PointsEditor = {
  Root,
  Background,
  Container,
  Point,
}

export { usePointsEditorContext } from './context'
export { clampPoint, type PointBaseType, type PointProps } from './Point'
