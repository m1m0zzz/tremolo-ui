// expand begin
import { useState } from 'react'
import { AnimationCanvas } from '@tremolo-ui/react'

import '@tremolo-ui/react/index.css'
// expand end

function App() {
  const [color, setColor] = useState('#0000ff')

  return (
    <div>
      <AnimationCanvas
        width={200}
        height={200}
        init={(ctx) => {
          ctx.font = '16px sans-serif'
        }}
        draw={(ctx, { width, height, count }) => {
          ctx.clearRect(0, 0, width, height)
          ctx.fillText(`frame: ${count}`, 0, 16)
          // draw sine wave
          const halfH = height / 2
          ctx.strokeStyle = color
          ctx.beginPath()
          for (let i = 0; i < width; i++) {
            const y =
              halfH +
              halfH * 0.5 * Math.sin((4 * Math.PI * (i + count * 2)) / width)
            if (i == 0) ctx.moveTo(i, y)
            else ctx.lineTo(i, y)
          }
          ctx.stroke()
        }}
      />
      <div>
        color:{' '}
        <input
          type="color"
          value={color}
          onChange={(v) => setColor(v.currentTarget.value)}
        />
      </div>
    </div>
  )
}

// expand begin
export default App
// expand end
