// expand begin
import { useState } from 'react'

import { XYPad } from '@tremolo-ui/react'

// Copy this file from the Styling page into your own project.
import xyPadTheme from './XYPad.module.css'

// expand end

function App() {
  const [valueX, setValueX] = useState(32)
  const [valueY, setValueY] = useState(56)

  return (
    <div>
      <XYPad.Root
        className={xyPadTheme.root}
        value={[valueX, valueY]}
        min={0}
        max={100}
        onChange={([x, y]) => {
          setValueX(x)
          setValueY(y)
        }}
      >
        <XYPad.Area className={xyPadTheme.area}>
          <XYPad.Thumb
            className={xyPadTheme.thumb}
            aria-label={['X position', 'Y position']}
          />
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
