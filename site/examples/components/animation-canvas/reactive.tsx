// expand begin
import { useState } from 'react'
import { AnimationCanvas, Slider } from '@tremolo-ui/react'

import '@tremolo-ui/react/styles/index.css'
// expand end

function App() {
  const [hue, setHue] = useState(200)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <AnimationCanvas
        animate={false}
        width={240}
        height={80}
        draw={(ctx, { width, height }) => {
          ctx.clearRect(0, 0, width, height)
          for (let x = 0; x < width; x += 12) {
            ctx.fillStyle = `hsl(${(hue + x) % 360} 90% 60%)`
            ctx.fillRect(x, 0, 10, height)
          }
        }}
      />
      <Slider.Root value={hue} min={0} max={360} onChange={(v) => setHue(v)}>
        <Slider.Track>
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>
    </div>
  )
}

// expand begin
export default App
// expand end
