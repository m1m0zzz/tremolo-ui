// expand begin
import { useState } from 'react'
import { XYPad } from '@tremolo-ui/react'

import '@tremolo-ui/react/styles/index.css'
// expand end

function App() {
  const [valueX, setValueX] = useState(32)
  const [valueY, setValueY] = useState(56)

  return (
    <div>
      <XYPad.Root
        value={[valueX, valueY]}
        min={0}
        max={100}
        onChange={([x, y]) => {
          setValueX(x)
          setValueY(y)
        }}
      >
        <XYPad.Area>
          <XYPad.Thumb />
        </XYPad.Area>
      </XYPad.Root>
      <p>
        x: {valueX}, y: {valueY}
      </p>
    </div>
  )
}

// expand begin
export default App
// expand end
