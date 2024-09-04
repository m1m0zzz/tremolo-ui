import { useState } from 'react'

import { Knob } from '../src/components/Knob'

export default {
  title: 'React/Components/Knob',
  component: Knob,
  tags: ['autodocs'],
}

export const Basic = () => {
  const [value, setValue] = useState(10)

  return (
    <div>
      <Knob
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
        enableWheel={['normalized', 0.1]}
      />
      <p>value: {value}</p>
    </div>
  )
}
