import { useState } from 'react'

import { useLongPress } from './useLongPress'

export default {
  title: 'Hooks/useLongPress',
}

/**
 * The callback runs once on press. Held past `initialDelay` (500 ms here), it
 * repeats every `interval` (40 ms) until the pointer is released — anywhere on
 * the page, so sliding off the button does not leave it running. Only the
 * primary button starts it.
 */
export const Basic = () => {
  const [count, setCount] = useState(0)

  const press = useLongPress(() => setCount((count) => count + 1), 500, 40)

  return (
    <div>
      <p>
        <button
          type="button"
          onPointerDown={(event) => press(event)}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          Hold here
        </button>
        <button type="button" onClick={() => setCount(0)}>
          Reset
        </button>
      </p>
      <div>count: {count}</div>
    </div>
  )
}
