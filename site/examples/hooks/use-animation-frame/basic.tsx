// expand begin
import { useState } from 'react'

import { useAnimationFrame } from '@tremolo-ui/react'
// expand end

function App() {
  const [running, setRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [fps, setFps] = useState(0)

  useAnimationFrame(
    (_timestamp, delta) => {
      // `delta` is 0 on the first frame after a start, so a pause is not
      // counted as one long frame.
      setElapsed((elapsed) => elapsed + delta)
      if (delta > 0) setFps(Math.round(1000 / delta))
    },
    { disabled: !running },
  )

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        style={{
          height: 8,
          marginBottom: '0.5rem',
          borderRadius: 9999,
          background: 'rgba(127, 127, 127, 0.3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${((elapsed % 2000) / 2000) * 100}%`,
            height: '100%',
            background: 'currentColor',
          }}
        />
      </div>
      <div>elapsed: {(elapsed / 1000).toFixed(2)} s</div>
      <div>fps: {running ? fps : '-'}</div>
      <button type="button" onClick={() => setRunning((r) => !r)}>
        {running ? 'Pause' : 'Resume'}
      </button>
    </div>
  )
}

// expand begin
export default App
// expand end
