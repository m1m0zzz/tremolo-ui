import { AnimationCanvas } from '../src/components/AnimationCanvas'

export default {
  title: 'React/Components/AnimationCanvas',
  component: AnimationCanvas,
  tags: ['autodocs'],
}

export const Basic = () => {
  return (
    <div>
      <AnimationCanvas
        init={(ctx) => {
          ctx.font = '16px sans-serif'
          ctx.strokeStyle = 'blue'
        }}
        draw={(ctx, w, h, count) => {
          ctx.clearRect(0, 0, w, h)
          ctx.fillText(String(count), 0, 16)
          // draw sine wave
          const halfH = h / 2
          ctx.beginPath()
          for (let i = 0; i < w; i++) {
            const y =
              halfH +
              halfH * 0.7 * Math.sin((4 * Math.PI * (i + count * 2)) / w)
            if (i == 0) ctx.moveTo(i, y)
            else ctx.lineTo(i, y)
          }
          ctx.stroke()
        }}
      />
    </div>
  )
}
