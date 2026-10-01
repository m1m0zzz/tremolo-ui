// expand begin
import { useState } from 'react'

import { useEventListener } from '@tremolo-ui/react'
// expand end

function App() {
  const [listening, setListening] = useState(true)
  const [key, setKey] = useState('-')

  // A function, so that `window` is read in the browser and not while the
  // page renders on the server. `null` listens on nothing.
  useEventListener(
    () => (listening ? window : null),
    'keydown',
    (event) => setKey(event.key === ' ' ? 'Space' : event.key),
  )

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        style={{
          padding: '2rem',
          marginBottom: '0.5rem',
          border: '1px solid currentColor',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        {listening ? 'Press any key' : 'Not listening'}
      </div>
      <div>last key: {key}</div>
      <label>
        <input
          type="checkbox"
          checked={listening}
          onChange={(event) => setListening(event.target.checked)}
        />{' '}
        Listen on window
      </label>
    </div>
  )
}

// expand begin
export default App
// expand end
