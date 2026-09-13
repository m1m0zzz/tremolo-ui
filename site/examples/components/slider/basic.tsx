// expand begin
import { useState } from 'react'

import { Slider } from '@tremolo-ui/react'

// Copy this file from the Styling page into your own project.
import sliderTheme from './Slider.module.css'

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
      <Slider.Root
        className={sliderTheme.root}
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
      >
        <Slider.Track className={sliderTheme.track}>
          <Slider.Thumb className={sliderTheme.thumb} aria-label="Level" />
        </Slider.Track>
      </Slider.Root>
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
