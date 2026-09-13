// expand begin
import { useState } from 'react'

import { NumberInput } from '@tremolo-ui/react'

// Copy this file from the Styling page into your own project.
import numberInputTheme from './NumberInput.module.css'

// expand end

function App() {
  const [value, setValue] = useState(64)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <NumberInput.Root
        className={numberInputTheme.root}
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
      >
        <NumberInput.InputField
          className={numberInputTheme.field}
          aria-label="Value"
        />
        <NumberInput.Stepper className={numberInputTheme.stepper}>
          <NumberInput.IncrementStepper
            className={numberInputTheme.incrementStepper}
          />
          <NumberInput.DecrementStepper
            className={numberInputTheme.decrementStepper}
          />
        </NumberInput.Stepper>
      </NumberInput.Root>
    </div>
    // expand end
  )
}

// expand begin
export default App
// expand end
