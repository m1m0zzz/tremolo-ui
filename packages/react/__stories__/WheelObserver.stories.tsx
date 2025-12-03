import { useState } from 'react'

import { toFixed } from '@tremolo-ui/functions'

import { NumberInput } from '../src/components/NumberInput'
import { WheelObserver } from '../src/components/WheelObserver'

export default {
  title: 'Base Components/WheelObserver',
  component: WheelObserver,
}

export const Basic = () => {
  const [count, setCount] = useState(0)
  const [deltaY, setDeltaY] = useState(0)
  const [scale, setScale] = useState(1)

  return (
    <div>
      <WheelObserver
        onWheel={(event) => {
          event.preventDefault()
          const { deltaY } = event
          setCount((count) => toFixed(count + deltaY * scale, 2))
          setDeltaY(deltaY)
        }}
        style={{
          width: 'fit-content',
          padding: '1rem',
          marginBottom: '0.5rem',
          border: '1px solid black',
        }}
      >
        Wheel here
      </WheelObserver>
      scale:{' '}
      <NumberInput.Root
        value={scale}
        min={0.1}
        step={0.1}
        width={10}
        onChange={(value) => {
          setScale(value)
        }}
        style={{
          width: 80,
          marginRight: '0.5rem',
        }}
      />
      <button type="button" onClick={() => setCount(0)}>
        Reset count
      </button>
      <div>count: {count}</div>
      <div>deltaY: {deltaY}</div>
    </div>
  )
}
