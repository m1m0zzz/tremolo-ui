import clsx from 'clsx'
import { ComponentPropsWithoutRef, forwardRef } from 'react'

import { Background } from './Background'
import { Container } from './Container'
import { PointsEditorProvider } from './context'
import { Point } from './Point'

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

export interface PointsEditorProps {
  width?: number | string
  height?: number | string

  disabled?: boolean
  readonly?: boolean
  bodyNoSelect?: boolean
}

type Props = PointsEditorProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorProps>

const PointsEditorImpl = forwardRef<HTMLDivElement, Props>(
  (
    {
      width = 200,
      height = 100,
      disabled = false,
      readonly = false,
      bodyNoSelect = true,
      style,
      className,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <PointsEditorProvider
        disabled={disabled}
        readonly={readonly}
        bodyNoSelect={bodyNoSelect}
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

export const PointsEditor = Object.assign(PointsEditorImpl, {
  Background,
  Container,
  Point,
})

export { type PointBaseType } from './Point'
