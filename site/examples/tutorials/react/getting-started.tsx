// expand begin
import { useState } from 'react'

import { Knob } from '@tremolo-ui/react'

// expand end

function App() {
  const [value, setValue] = useState(64)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Knob
        value={value}
        min={0}
        max={100}
        size={50}
        onChange={(v) => setValue(v)}
      />
      {value}
    </div>
  )
}

// expand begin
export default App
// expand end
