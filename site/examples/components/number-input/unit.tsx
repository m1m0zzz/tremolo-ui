// expand begin
import { useState } from 'react'

import { unitFormat } from '@tremolo-ui/functions'
import { NumberInput } from '@tremolo-ui/react'

// expand end

// Hertz takes SI prefixes, so 1234 is shown as 1.23kHz.
const hz = unitFormat('Hz', { digits: 2 })

// Decibels do not: `d` is already deci, and -6dB is not -0.6B.
const dB = unitFormat('dB', { prefixes: false, digits: 1 })

// This one is stored in milliseconds, so 1500 is shown as 1.5s.
const ms = unitFormat('s', { base: 'm', digits: 2 })

function App() {
  const [frequency, setFrequency] = useState(1234)
  const [gain, setGain] = useState(-6.25)
  const [release, setRelease] = useState(1500)

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      <NumberInput.Root
        {...hz}
        value={frequency}
        min={20}
        max={22000}
        onChange={setFrequency}
      >
        <NumberInput.InputField />
      </NumberInput.Root>
      <NumberInput.Root
        {...dB}
        value={gain}
        min={-60}
        max={6}
        step={0.1}
        onChange={setGain}
      >
        <NumberInput.InputField />
      </NumberInput.Root>
      <NumberInput.Root
        {...ms}
        value={release}
        min={1}
        max={10000}
        onChange={setRelease}
      >
        <NumberInput.InputField />
      </NumberInput.Root>
    </div>
    // expand end
  )
}

// expand begin
export default App
// expand end
