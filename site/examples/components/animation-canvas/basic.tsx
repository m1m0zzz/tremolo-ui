// expand begin
import { useState } from 'react'
import { AnimationCanvas } from '@tremolo-ui/react'

import '@tremolo-ui/react/styles/index.css'
// expand end

function App() {
  const [color, setColor] = useState('#0000ff')

  return (
    <div>
      <AnimationCanvas
        init={(ctx) => {
          ctx.font = '16px sans-serif'
        }}
        draw={(ctx, w, h, count) => {
          ctx.clearRect(0, 0, w.current, h.current)
          ctx.fillText(`frame: ${count}`, 0, 16)
          // draw sine wave
          const halfH = h.current / 2
          ctx.strokeStyle = color
          ctx.beginPath()
          for (let i = 0; i < w.current; i++) {
            const y =
              halfH +
              halfH *
                0.5 *
                Math.sin((4 * Math.PI * (i + count * 2)) / w.current)
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
