// expand begin
import { useState } from 'react'

import { toFixed } from '@tremolo-ui/functions'
import { useWheel } from '@tremolo-ui/react'
// expand end

function App() {
  const [count, setCount] = useState(0)
  const [deltaY, setDeltaY] = useState(0)

  const wheelRef = useWheel<HTMLDivElement>((event) => {
    // The listener is not passive, so the page can be kept from scrolling.
    event.preventDefault()
    setDeltaY(event.deltaY)
    setCount((count) => toFixed(count - event.deltaY * 0.01, 2))
  })

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={wheelRef}
        style={{
          padding: '2rem',
          marginBottom: '0.5rem',
          border: '1px solid currentColor',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        Wheel here
      </div>
      <div>count: {count}</div>
      <div>deltaY: {deltaY}</div>
    </div>
  )
}

// expand begin
export default App
// expand end
