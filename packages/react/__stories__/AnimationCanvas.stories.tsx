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
        width={300}
        height={200}
        init={(ctx) => {
          ctx.font = '16px sans-serif'
          ctx.strokeStyle = 'blue'
        }}
        draw={(ctx, w, h, count) => {
          ctx.clearRect(0, 0, w.current, h.current)
          ctx.fillText(`frame: ${count}`, 0, 16)
          // draw sine wave
          const halfH = h.current / 2
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
    </div>
  )
}

const fillTextCenter = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) => {
  const w = ctx.measureText(text).width
  ctx.fillText(text, x - w / 2, y)
}

export const RelativeSize = () => {
  return (
    <div
      style={{
        width: 300,
        height: 200,
        minWidth: 150,
        minHeight: 150,
        resize: 'both',
        overflow: 'hidden',
        border: '1px solid black',
      }}
    >
      <AnimationCanvas
        relativeSize={true}
        draw={(ctx, w, h) => {
          ctx.strokeStyle = 'black'
          // bg
          ctx.rect(0, 0, w.current, h.current)
          ctx.fillStyle = 'white'
          ctx.fill()

          // frame
          const len = 40
          const pad = 20
          const lines: [number, number][][] = [
            [
              [pad, pad + len],
              [0, -len],
              [len, 0],
            ],
            [
              [w.current - pad - len, pad],
              [len, 0],
              [0, len],
            ],
            [
              [w.current - pad, h.current - pad - len],
              [0, len],
              [-len, 0],
            ],
            [
              [pad + len, h.current - pad],
              [-len, 0],
              [0, -len],
            ],
          ]
          lines.forEach((group) => {
            ctx.beginPath()
            let beforeX = 0,
              beforeY = 0
            group.forEach((line, i) => {
              if (i == 0) {
                beforeX = line[0]
                beforeY = line[1]
                ctx.moveTo(...line)
              } else {
                beforeX += line[0]
                beforeY += line[1]
                ctx.lineTo(beforeX, beforeY)
              }
            })
            ctx.stroke()
          })

          // text
          ctx.fillStyle = 'black'
          ctx.font = '16px sans-serif'
          fillTextCenter(ctx, `w: ${w.current}`, w.current / 2, h.current / 2)
          fillTextCenter(
            ctx,
            `h: ${h.current}`,
            w.current / 2,
            h.current / 2 + 20,
          )
        }}
      />
    </div>
  )
}
