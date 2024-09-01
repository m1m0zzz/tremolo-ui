import { useState } from 'react'

import { Knob } from '@/components/Knob'

export default {
  title: 'Components/Knob',
  component: Knob,
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
        enableWheel={["normalized", 0.1]}
      />
      <p>value: {value}</p>
    </div>
  )
}
