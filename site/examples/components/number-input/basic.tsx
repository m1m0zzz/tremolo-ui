// expand begin
import { useState } from 'react'
import { NumberInput } from '@tremolo-ui/react'

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
      }}
    >
      <NumberInput
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
      >
        <NumberInput.Stepper>
          <NumberInput.IncrementStepper />
          <NumberInput.DecrementStepper />
        </NumberInput.Stepper>
      </NumberInput>
    </div>
    // expand end
  )
}

// expand begin
export default App
// expand end
