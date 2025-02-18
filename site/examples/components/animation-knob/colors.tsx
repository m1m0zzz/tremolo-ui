// expand begin
import { AnimationKnob } from '@tremolo-ui/react'
import { useState } from 'react'
// expand end

function App() {
  const [value, setValue] = useState(0)

  const fmt = (value: number) => {
    if (value < 0) return `${-value}L`
    else if (value > 0) return `${value}R`
    else return `C`
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: '#666',
        color: 'white',
        padding: '1rem',
      }}
    >
      <p>Pan</p>
      <AnimationKnob
        value={value}
        startValue={0}
        defaultValue={0}
        min={-50}
        max={50}
        activeColor="#6ED8E6"
        inactiveColor="#161616"
        thumb="#161616"
        bg="#0000"
        lineWeight={4}
        onChange={(v) => setValue(v)}
        wheel={['normalized', 0.1]}
      />
      <span>{fmt(value)}</span>
    </div>
  )
}

// expand begin
export default App
// expand end
