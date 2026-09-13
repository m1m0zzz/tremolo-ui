// expand begin
import { useState } from 'react'

import { Knob } from '@tremolo-ui/react'

// expand end

function App() {
  const [value, setValue] = useState(64)

  return (
    <div className="flex flex-col items-center justify-center">
      <Knob.Root
        aria-label="Level"
        // `group` so the lines can follow the knob's own hover and focus.
        className="group size-[50px] shrink-0 cursor-grab outline-0"
        value={value}
        min={0}
        max={100}
        size={50}
        onChange={(v) => setValue(v)}
      >
        <Knob.SVGRoot>
          <Knob.InactiveLine className="text-neutral-200 group-hover:text-neutral-300 dark:text-neutral-700 dark:group-hover:text-neutral-600" />
          <Knob.ActiveLine className="text-red-500 group-hover:text-red-600 group-focus:text-red-600 dark:text-red-600 dark:group-hover:text-red-500 dark:group-focus:text-red-500" />
          <Knob.Thumb
            className="text-neutral-300 group-hover:text-neutral-400 dark:text-neutral-600 dark:group-hover:text-neutral-500"
            classes={{ thumbLine: 'text-neutral-50 dark:text-neutral-300' }}
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
