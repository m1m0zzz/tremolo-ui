// expand begin
import { AnimationCanvas } from '@tremolo-ui/react'

import '@tremolo-ui/react/index.css'
// expand end

function App() {
  return (
    <div
      style={{
        width: 300,
        height: 200,
      }}
    >
      <AnimationCanvas
        relativeSize
        draw={(ctx, { width, height, elapsedTime, count }) => {
          // save default context
          ctx.save()

          ctx.clearRect(0, 0, width, height)
          ctx.fillStyle = 'gray'
          ctx.fillRect(40, 40, 30, 30)

          // change scale
          ctx.scale(2, 2)

          ctx.fillStyle = 'red'
          ctx.fillRect(40, 40, 30, 30)

          // restore default context
          ctx.restore()

          ctx.fillStyle = 'black'
          ctx.font = '16px sans-serif'
          ctx.fillText(
            `frame: ${count}, ${(elapsedTime / 1000).toFixed(2)} s`,
            0,
            16,
          )
        }}
      />
    </div>
  )
}

// expand begin
export default App
// expand end
