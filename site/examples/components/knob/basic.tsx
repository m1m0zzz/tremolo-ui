// expand begin
import { Knob } from '@tremolo-ui/react'
import { useState } from 'react'
// expand end

function App() {
  const [value, setValue] = useState(64)

  return (
    // expand alt
    // <>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
    {/* expand end */}
      <Knob
        value={value}
        min={0}
        max={100}
        size={50}
        onChange={(v) => setValue(v)}
      />
      {value}
    {/* expand alt */}
    {/* </> */}
    </div>
    // expand end
  )
}

// expand begin
export default App
// expand end
