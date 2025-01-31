import { useState } from 'react'

import {
  XYPad,
  // XYPadThumb,
  // XYPadArea,
} from '../src/components/XYPad'

export default {
  title: 'React/Components/XYPad',
  component: XYPad,
  tags: ['autodocs'],
}

export const Basic = () => {
  const [valueX, setValueX] = useState(32)
  const [valueY, setValueY] = useState(56)

  return (
    <>
      <XYPad
        x={{
          value: valueX,
          min: 0,
          max: 100
        }}
        y={{
          value: valueY,
          min: 0,
          max: 100
        }}
        onChange={(x, y) => {
          setValueX(x)
          setValueY(y)
        }} />
      <p>x: {valueX}</p>
      <p>y: {valueY}</p>
    </>
  )
}
