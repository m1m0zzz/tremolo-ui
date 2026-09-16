// expand begin
import { useState } from 'react'

import { useDragValue } from '@tremolo-ui/react'
// expand end

function App() {
  const [value, setValue] = useState(50)

  const { refCallback, dragging } = useDragValue<HTMLDivElement>({
    axis: { min: 0, max: 100, reverse: true },
    // The value moves away from where it stood, so the hook has to be able to
    // read it. 200px of movement covers the whole range.
    getValue: () => [0, value],
    pixelRange: 200,
    // Hold shift to cover a tenth of the range with the same movement.
    sensitivity: (state) => (state.event.shiftKey ? 0.1 : 1),
    cursor: 'ns-resize',
    onChange: ([, y]) => setValue(y),
  })

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={refCallback}
        style={{
          padding: '2rem',
          marginBottom: '0.5rem',
          border: '1px solid currentColor',
          borderRadius: 8,
          textAlign: 'center',
          touchAction: 'none',
        }}
      >
        Drag up and down
      </div>
      <div>dragging: {String(dragging)}</div>
      <div>value: {value.toFixed(1)}</div>
    </div>
  )
}

// expand begin
export default App
// expand end
