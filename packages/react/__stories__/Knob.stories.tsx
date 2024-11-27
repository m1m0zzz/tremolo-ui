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

export const Size = () => {
  const [value, setValue] = useState(10)

  return (
    <div
      style={{
        backgroundColor: 'azure',
        width: '100%',
        height: 300,
        resize: 'both',
        overflow: 'hidden',
      }}
    >
      <Knob
        width={'100%'}
        height={'100%'}
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

export const Options = () => {
  const [value, setValue] = useState(0)

  const fmt = (value: number) => {
    if (value < 0) return `${-value}L`
    else if (value > 0) return `${value}R`
    else return `C`
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: '#666',
        color: 'white',
      }}
    >
      <p>Pan</p>
      <Knob
        value={value}
        startValue={0}
        defaultValue={0}
        min={-50}
        max={50}
        options={{
          active: '#6ED8E6',
          inactive: '#161616',
          thumb: '#161616',
          bg: '#0000',
          lineWeight: 4,
        }}
        onChange={(v) => setValue(v)}
        enableWheel={['normalized', 0.1]}
      />
      <span>{fmt(value)}</span>
    </div>
  )
}
