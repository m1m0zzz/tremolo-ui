import { useState } from 'react'

import { WaveSelector as Impl } from './components/WaveSelector'

export default {
  title: 'combined/WaveSelector',
  tags: ['!autodocs'],
}

export const WaveSelector = () => {
  const [position, setPosition] = useState(0) // wavetable position

  return <Impl position={position} setPosition={setPosition} />
}
