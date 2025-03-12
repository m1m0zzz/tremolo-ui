import { useState } from 'react'

import { DragObserver } from '../src/components/DragObserver'

export default {
  title: 'Base Components/DragObserver',
  component: DragObserver,
}

export const Basic = () => {
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [dx, setDx] = useState(0)
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)

  return (
    <div
      style={{
        userSelect: 'none',
      }}
    >
      <DragObserver
        onDragStart={() => {
          setDragging(true)
        }}
        onDragEnd={() => {
          setDragging(false)
        }}
        onDrag={(x, y, dx, dy) => {
          setX(x)
          setY(y)
          setDx(dx)
          setDy(dy)
        }}
        onDoubleClick={() => {}}
        style={{
          padding: '1rem',
          marginBottom: '0.5rem',
          border: '1px solid black',
        }}
      >
        Drag here
        <div>dragging: {String(dragging)}</div>
      </DragObserver>
      <div>x: {x}</div>
      <div>y: {y}</div>
      <div>dx: {dx}</div>
      <div>dy: {dy}</div>
    </div>
  )
}
