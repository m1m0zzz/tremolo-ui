// expand begin
import { useState } from 'react'
import { Knob } from '@tremolo-ui/react'

import '@tremolo-ui/react/styles/Knob.css'
import myKnob from './my-knob.module.css'
// expand end

function App() {
  const [value, setValue] = useState(64)

  return (
    <div className={myKnob.container}>
      <Knob.Root
        className={myKnob.knob}
        value={value}
        min={0}
        max={100}
        size={50}
        onChange={(v) => setValue(v)}
      >
        <Knob.SVGRoot>
          <Knob.ActiveLine className={myKnob.activeLine} />
          <Knob.InactiveLine />
          <Knob.Thumb />
        </Knob.SVGRoot>
      </Knob.Root>
      {value}
    </div>
  )
}

// expand begin
export default App
// expand end
