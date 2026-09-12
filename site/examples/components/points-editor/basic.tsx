// expand begin
import { useState } from 'react'

import { PointsEditor } from '@tremolo-ui/react'

// expand end

function App() {
  const [points, setPoints] = useState({
    'p-0': { x: 0, y: 0.5 },
    'p-1': { x: 0.35, y: 0.15 },
    'p-2': { x: 0.7, y: 0.85 },
    'p-3': { x: 1, y: 0.5 },
  })

  return (
    <div>
      <PointsEditor.Root selectable>
        <PointsEditor.Background
          style={{ background: '#f2f4f5', borderRadius: 4 }}
        />
        <PointsEditor.Container>
          {Object.entries(points).map(([id, point]) => (
            <PointsEditor.Point
              key={id}
              id={id}
              value={point}
              onChange={(value) =>
                setPoints((prev) => ({ ...prev, [id]: value }))
              }
            />
          ))}
        </PointsEditor.Container>
      </PointsEditor.Root>
      <p>
        {Object.entries(points)
          .map(([id, { x, y }]) => `${id}: (${x}, ${y})`)
          .join(' / ')}
      </p>
    </div>
  )
}

// expand begin
export default App
// expand end
