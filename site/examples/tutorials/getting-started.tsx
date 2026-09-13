// expand begin
import { useState } from 'react'

import { Knob } from '@tremolo-ui/react'

// Copy this file from the Styling page into your own project.
import knobTheme from './Knob.module.css'
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
      <Knob.Root
        className={knobTheme.root}
        aria-label="Level"
        value={value}
        min={0}
        max={100}
        size={50}
        onChange={(v) => setValue(v)}
      >
        <Knob.SVGRoot>
          <Knob.ActiveLine className={knobTheme.activeLine} />
          <Knob.InactiveLine className={knobTheme.inactiveLine} />
          <Knob.Thumb
            className={knobTheme.thumb}
            classes={{ thumbLine: knobTheme.thumbLine }}
          />
        </Knob.SVGRoot>
      </Knob.Root>
      {value}
    </div>
  )
}

// expand begin
export default App
// expand end
