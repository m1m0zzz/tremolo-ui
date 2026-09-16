// expand begin
import { useState } from 'react'

import { useDrag } from '@tremolo-ui/react'
// expand end

function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [delta, setDelta] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const dragRef = useDrag<HTMLDivElement>({
    cursor: 'grabbing',
    onDragStart: () => setDragging(true),
    onDragEnd: () => setDragging(false),
    onDrag: (x, y, deltaX, deltaY) => {
      setPosition({ x, y })
      setDelta({ x: deltaX, y: deltaY })
    },
  })

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={dragRef}
        style={{
          padding: '2rem',
          marginBottom: '0.5rem',
          border: '1px solid currentColor',
          borderRadius: 8,
          textAlign: 'center',
          touchAction: 'none',
        }}
      >
        Drag here
      </div>
      <div>dragging: {String(dragging)}</div>
      <div>
        x: {position.x}, y: {position.y}
      </div>
      <div>
        deltaX: {delta.x}, deltaY: {delta.y}
      </div>
    </div>
  )
}

// expand begin
export default App
// expand end
