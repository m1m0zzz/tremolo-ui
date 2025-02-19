// expand begin
import { useState } from 'react'

import { XYPad } from '@tremolo-ui/react'

// expand end

function App() {
  const [valueX, setValueX] = useState(32)
  const [valueY, setValueY] = useState(56)

  return (
    <div>
      <XYPad
        x={{
          value: valueX,
          min: 0,
          max: 100,
        }}
        y={{
          value: valueY,
          min: 0,
          max: 100,
        }}
        onChange={(x, y) => {
          setValueX(x)
          setValueY(y)
        }}
      />
      <p>
        x: {valueX}, y: {valueY}
      </p>
    </div>
  )
}

// expand begin
export default App
// expand end
