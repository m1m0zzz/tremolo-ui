import { useState } from 'react'

import { useDrag } from '../src/hooks/useDrag'

export default {
  title: 'Hooks/useDrag',
}

export const Basic = () => {
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [dx, setDx] = useState(0)
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)

  const dragRef = useDrag<HTMLDivElement>({
    onDragStart: () => {
      setDragging(true)
    },
    onDragEnd: () => {
      setDragging(false)
    },
    onDrag: (x, y, dx, dy) => {
      setX(x)
      setY(y)
      setDx(dx)
      setDy(dy)
    },
  })

  return (
    <div
      style={{
        userSelect: 'none',
      }}
    >
      <div
        ref={dragRef}
        style={{
          padding: '1rem',
          marginBottom: '0.5rem',
          border: '1px solid black',
        }}
      >
        Drag here
        <div>dragging: {String(dragging)}</div>
      </div>
      <div>x: {x}</div>
      <div>y: {y}</div>
      <div>dx: {dx}</div>
      <div>dy: {dy}</div>
    </div>
  )
}
