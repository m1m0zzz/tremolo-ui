// expand begin
import { useState } from 'react'
import { Slider } from '@tremolo-ui/react'

import '@tremolo-ui/react/styles/index.css'
// expand end

function App() {
  const [value, setValue] = useState(64)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Slider value={value} min={0} max={100} onChange={(v) => setValue(v)} />
      <span
        style={{
          width: '2rem',
        }}
      >
        {value}
      </span>
    </div>
    // expand end
  )
}

// expand begin
export default App
// expand end
